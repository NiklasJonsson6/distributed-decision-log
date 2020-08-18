'use strict';

const { Wallets, Gateway } = require('fabric-network');
const yaml = require('js-yaml');
const fs = require('fs');

const ping = async (walletPath) => {
  const gateway = new Gateway();
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  try {
    const connectionOptions = {
      identity: 'admin',
      wallet: wallet,
      discovery: { enabled: true, asLocalhost: false }
    };

    console.log('connecting to gateway');
    await gateway.connect(yaml.safeLoad(fs.readFileSync('src/resources/connection-yolean.yaml', 'utf8')), connectionOptions);
    const network = await gateway.getNetwork('meeting1');
    const contract = await network.getContract('decision-log-shim');
    console.log('submitting transaction');
    const response = await contract.submitTransaction('ping');
    console.log(`response: ${response}`);
  } catch (error) {
    console.log(`Error on ping: ${error}`);
    console.log(error.stack);
  }
};

module.exports = ping;
