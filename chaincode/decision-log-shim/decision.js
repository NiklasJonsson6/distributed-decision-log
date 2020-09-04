'use strict';

const shim = require('fabric-shim');
const {logger} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils').utils;
const myLogger = logger.getLogger('myLogger');
const ChaincodeBase = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils').ChaincodeBase;

const states = {
  PENDING: 'pending',
  ONGOING: 'ongoing',
  ENDED: 'ended'
};

const Decision = class extends ChaincodeBase {
  constructor() {
    super(shim);
  }


  /**
   * Retreives the given decision's current state
   * @param {string} decision_id
   * @returns {Object} the decision
   */
  async queryDecision(stub, txHelper, decision_id) {
    const decision = await txHelper.getStateAsObject(decision_id);
    // Get all clients prefixed with 'decision_id~'
    // Add them to decision and return
    //stub.getStateByPartialCompositeKey()
    myLogger.info(`Queried decision with id: ${decision_id}, ${JSON.stringify(decision)}`);
    return decision;
  }

  /**
   * Starts a decision as pending
   * @param {string} client_id the initiating client
   * @returns {string} decision_id
   */
  async startDecision(stub, txHelper, decision_id = txHelper.uuid('decision')) {
    //const decision_id = t;
    const decision = {
      decision_id: decision_id,
      state: states.PENDING,
      attendance: [] // Separate rows for clients
    };
    await txHelper.putState(decision_id, decision);
    myLogger.info(`Decision with id ${decision_id} added to ledger`);
    return decision_id;
  }

  /**
   * Joins a pending decision
   * @param {string} decision_id
   * @param {string} client_id
   */
  async join(stub, txHelper, client_id, decision_id) {
    // Querying decision puts it into the read_set,
    // which is intended to prevent joins after state change while still allowing concurrent joins
    const decision = await txHelper.getStateAsObject(decision_id);
    if (decision.state !== states.PENDING) {
      throw new Error(`Decision state is ${decision.state}, should be ${states.PENDING}`);
    }

    // client should not yet exist
    if (typeof await txHelper.getStateAsObject(client_id) === 'undefined') {
      const client = {
        client_id: client_id,
        reservation: false,
        hereAtStart: false,
        hereAtEnd: false
      };
      const compositeKey = stub.createCompositeKey('decision~client', [decision_id, client_id]);
      await txHelper.putState(compositeKey, client);
      myLogger.info(`Client added with key: ${compositeKey}`);
    } else {
      throw new Error(`Client with id ${client_id} has already joined the decision with id ${decision_id}`);
    }
  }

  /**
   * Sets a decision from pending to ongoing
   * @param {string} decision_id the decision to start
   * @returns "success" if state was set successfully
   */
  async setOngoing(stub, txHelper, decision_id) {
    const decision = await txHelper.getStateAsObject(decision_id);
    if (decision.state !== states.PENDING) {
      throw new Error(`Decision state is ${decision.state}, should be ${states.PENDING}`);
    }
    decision.state = states.ONGOING;
    await txHelper.putState(decision_id, decision);
    myLogger.info(`Decision with id: ${decision_id} set to ${states.ONGOING}`);
    return 'success';
  }

  /**
   * Asserts the client's participation
   * @param {string} client_id
   * @param {string} decision_id
   */
  async here(stub, txHelper, client_id, decision_id) {
    const decision = await txHelper.getStateAsObject(decision_id);
    const iterator = await stub.getStateByPartialCompositeKey('decision~client', [decision_id, client_id]);
    const client = JSON.parse((await iterator.next()).value.value.toString());
    myLogger.debug(client);
    if (decision.state === states.ONGOING) {
      client.hereAtStart = true;
    } else if (decision.state === states.ENDED) {
      client.hereAtEnd = true;
    } else {
      throw new Error(`Decision with id: ${decision_id} is in state ${decision.state}, should be ${states.ONGOING} or ${states.ENDED}`);
    }
    myLogger.debug(client);
    await txHelper.putState(stub.createCompositeKey('decision~client', [decision_id, client_id]), client);
    myLogger.info(`Client with id: ${client_id} announced its participation in decision ${decision_id}`);
  }

  /**
   * Ends the ongoing phase of a decision
   * @param {string} decision_id
   */
  async setEnded(stub, txHelper, decision_id) {
    const decision = await txHelper.getStateAsObject(decision_id);
    if (decision.state !== states.ONGOING) {
      throw new Error(`Decision state is ${decision.state}, should be ${states.ONGOING}`);
    }
    decision.state = states.ENDED;
    await txHelper.putState(decision_id, decision);
    myLogger.info(`Decision with id: ${decision_id} set to ${states.ENDED}`);
    return 'success';
  }
};

module.exports = Decision;
