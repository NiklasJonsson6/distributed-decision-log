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
    myLogger.info(`Queried decision with id: ${decision_id}, ${JSON.stringify(decision)}`);
    return decision;
  }

  /**
   * Starts a decision as pending
   * @param {string} client_id the initiating client
   * @returns {string} decision_id
   */
  async startDecision(stub, txHelper, client_id, decision_id = txHelper.uuid('decision')) {
    //const decision_id = t;
    const decision = {
      decision_id: decision_id,
      state: states.PENDING,
      attendance: [
        {
          client_id: client_id,
          reservation: false,
          hereAtStart: false,
          hereAtEnd: false
        }
      ]
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
    const decision = await txHelper.getStateAsObject(decision_id);
    if (decision.state !== states.PENDING) {
      throw new Error(`Decision state is ${decision.state}, should be ${states.PENDING}`);
    }
    if (decision.attendance.filter(client => client.client_id === client_id).length > 0) {
      throw new Error(`Client with id: ${client_id} is already joined to the decision`);
    }
    decision.attendance.push({
      client_id: client_id,
      reservation: false,
      hereAtStart: false,
      hereAtEnd: false
    });
    await txHelper.putState(decision_id, decision);
    myLogger.info(`Client with id: ${client_id} joined decision with id: ${decision_id}`);
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
    const index = decision.attendance.findIndex(client => client.client_id === client_id);
    if (index === -1) {
      throw new Error(`Client with id: ${client_id} is not in attendance`);
    }
    if (decision.state === states.ONGOING) {
      decision.attendance[index].hereAtStart = true;
    } else if (decision.state === states.ENDED) {
      decision.attendance[index].hereAtEnd = true;
    } else {
      throw new Error(`Decision with id: ${decision_id} is in state ${decision.state}, should be ${states.ONGOING} or ${states.ENDED}`);
    }
    await txHelper.putState(decision_id, decision);
    myLogger.info(`Client with id: ${client_id} announced its participation`);
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
