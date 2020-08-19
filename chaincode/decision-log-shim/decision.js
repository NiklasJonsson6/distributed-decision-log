'use strict';

const shim = require('fabric-shim');
const {logger} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils').utils;
const myLogger = logger.getLogger('myLogger');
const ChaincodeBase = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils').ChaincodeBase;

const Decision = class extends ChaincodeBase {
  constructor() {
    super(shim);
  }

  async startDecision(stub, txHelper) {
    const queryString = {
      selector: {}
    };
    const n = await txHelper.getQueryResultAsList(queryString);
    const decisionId = n.toString();
    myLogger.info(`startDecision returned id: ${n.length}`);
    return decisionId;
  }

  async join(stub, txHelper, client_id) {
    myLogger.info(`join() called by ${client_id}`);
    return 'join called';
  }
};

module.exports = Decision;
