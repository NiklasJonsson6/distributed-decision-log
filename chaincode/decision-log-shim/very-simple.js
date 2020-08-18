const shim = require('fabric-shim');
const logger = shim.newLogger('chaincode');
const ChaincodeBase = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils').ChaincodeBase;

const Chaincode = class extends ChaincodeBase {
  constructor() {
    super(shim);
  }

  async test() {
    logger.info('called test');
    return 'answer';
  }

  async testWithText(text) {
    logger.info('called test with text');
    return 'answer';
  }
};

module.exports = Chaincode;
