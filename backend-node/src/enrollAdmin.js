'use strict';

const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const yaml = require('js-yaml');
const path = require('path');


const enroll = async () => {
  try {
    const connectionProfile = yaml.safeLoad(fs.readFileSync('src/resources/connection-yolean.yaml', 'utf8'));

    // CA
    const caInfo = connectionProfile.certificateAuthorities['hlf-ca--yolean'];
    const ca = new FabricCAServices(caInfo.url);

    // Wallet
    const walletPath = path.join(process.cwd(), 'src/resources/wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    if (await wallet.get('admin')) {
      console.log('User admin already exists in the wallet');
      return walletPath;
    }

    const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes()
      },
      mspId: 'YoleanMSP',
      type: 'X.509'
    };
    await wallet.put('admin', x509Identity);

    console.log('Sucessfully enrolled admin');
    return walletPath;
  } catch (error) {
    console.error(`Failed to enroll admin: ${error}`);
    process.exit(1);
  }
};


module.exports.enroll = enroll;