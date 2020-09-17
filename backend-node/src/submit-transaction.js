'use strict';

const { Wallets, Gateway, } = require('fabric-network');
const { Client } = require('fabric-common');
const yaml = require('js-yaml');
const fs = require('fs');

/**
 * Submit a transaction to the ledger
 * @param {string} walletPath
 * @param {string} name
 * @param  {...string} args
 */
const submitTransaction = async (walletPath, name, ...args) => {
  let opt = {
    'grpc.max_receive_message_length': -1,
    'grpc.max_send_message_length': -1,
    'grpc.keepalive_time_ms': 120000,
    'grpc.http2.min_time_between_pings_ms': 120000,
    'grpc.keepalive_timeout_ms': 20000,
    'grpc.http2.max_pings_without_data': 0,
    'grpc.keepalive_permit_without_calls': 1,
    'grpc-wait-for-ready-timeout': 10000,
    'request-timeout' : 45000
  };
  Client.setConfigSetting('connection-options', opt);
  let gateway = new Gateway();
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  try {
    const connectionOptions = {
      identity: 'admin',
      wallet: wallet,
      discovery: { enabled: true, asLocalhost: false }
    };

    //console.log('connecting to gateway');
    await gateway.connect(yaml.safeLoad(fs.readFileSync('src/resources/connection-bft.yaml', 'utf8')), connectionOptions);
    const network = await gateway.getNetwork('meeting1');
    const contract = network.getContract('decision-log-shim');

    //console.log(`submitting transaction: ${name} with args: ${args}`);
    const response = await contract.submitTransaction(name, ...args);
    //console.log(`response: ${response}`);
    return response.toString('utf-8');
  } catch (error) {
    console.log(`Error on transaction: ${error}`);
    console.log(error.stack);
  } finally {
    gateway.disconnect();
  }
};

module.exports = submitTransaction;