package se.yolean.backend;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeoutException;

import javax.enterprise.context.ApplicationScoped;

import java.util.Properties;

import org.hyperledger.fabric.gateway.Contract;
import org.hyperledger.fabric.gateway.ContractException;
import org.hyperledger.fabric.gateway.Gateway;
import org.hyperledger.fabric.gateway.Network;
import org.hyperledger.fabric.gateway.Wallet;
import org.hyperledger.fabric.gateway.Wallet.Identity;

import org.hyperledger.fabric.sdk.Enrollment;
import org.hyperledger.fabric.sdk.security.CryptoSuite;
import org.hyperledger.fabric.sdk.security.CryptoSuiteFactory;

import org.hyperledger.fabric_ca.sdk.EnrollmentRequest;
import org.hyperledger.fabric_ca.sdk.HFCAClient;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ApplicationScoped
public class ClientGateway {

  private final Logger logger = LoggerFactory.getLogger(ClientGateway.class);

  public void connect() throws Exception {
    Path walletPath = Paths.get("wallet");
    Wallet wallet = Wallet.createFileSystemWallet(walletPath);
    logger.info("File system wallet created at path {}", walletPath.toString());

    enrollAdmin(wallet);

    Path networkConfigPath = Paths.get("..", "src", "main", "resources", "connection-yolean.yaml");

    Gateway.Builder builder = Gateway.createBuilder();
    builder
      .identity(wallet, "admin")
      .networkConfig(networkConfigPath)
      .discovery(true);

    try (Gateway gateway = builder.connect()) {
      Network network = gateway.getNetwork("meeting1");
      Contract contract = network.getContract("very-simple");
      logger.info("get channel: {} and chaincode: {}", network.toString(), contract.toString());
    }
  }

  private void enrollAdmin(Wallet wallet) throws Exception {
    Properties props = new Properties();
    props.put("pemFile", "../network-config/crypto-config/peerOrganizations/yolean.se/ca/ca.yolean.se-cert.pem");
    props.put("allowAllHostNames", "true");
    HFCAClient caClient = HFCAClient.createNewInstance("http://hlf-ca--yolean:7054", props);
    CryptoSuite cryptoSuite = CryptoSuiteFactory.getDefault().getCryptoSuite();
    caClient.setCryptoSuite(cryptoSuite);
    
    if (wallet.exists("admin")) {
      logger.info("An identity for the admin user \"admin\" already exists in the wallet");
      return;
    }

    final EnrollmentRequest enrollmentRequest = new EnrollmentRequest();
    enrollmentRequest.addHost("hlf-ca--yolean");
    //enrollmentRequestTLS.setProfile("tls");
    Enrollment enrollment = caClient.enroll("admin", "adminpw", enrollmentRequest);
    Identity user = Identity.createIdentity("YoleanMSP", enrollment.getCert(), enrollment.getKey());
    wallet.put("admin", user);
    logger.info("Successfully enrolled user \"admin\" and imported it into the wallet");
  }
}