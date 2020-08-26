'use strict';

const { Wallets, Gateway } = require('fabric-network');
const yaml = require('js-yaml');
const fs = require('fs');

/**
 * Submit a transaction to the ledger
 * @param {string} walletPath
 * @param {string} name
 * @param  {...string} args
 */
const submitTransaction = async (walletPath, name, ...args) => {
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
    const contract = network.getContract('decision-log-shim');

    console.log(`submitting transaction: ${name} with args: ${args}`);
    const response = await contract.submitTransaction(name, args);
    console.log(`response: ${response}`);
    return response;
  } catch (error) {
    console.log(`Error on transaction: ${error}`);
    console.log(error.stack);
    throw error;
  } finally {
    gateway.disconnect();
  }
};

module.exports = submitTransaction;