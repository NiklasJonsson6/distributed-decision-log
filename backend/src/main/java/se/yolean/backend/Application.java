package se.yolean.backend;

import javax.ws.rs.GET;
import javax.ws.rs.Path;

import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Path("/ping")
public class Application {
    /*
    Select an identity from a wallet
    Connect to a gateway
    Access the desired network
    Construct a transaction request for a smart contract
    Submit the transaction to the network
    Process the response
    */

    private final Logger logger = LoggerFactory.getLogger(Application.class);
    private final ClientGateway gateway;

    public Application(ClientGateway gateway) {
        this.gateway = gateway;
    }

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() {
        try {
            gateway.connect();
            return "connected successfully";
        } catch (Exception e) {
            logger.error("Error connecting", e);
        }

        return "error :(";
    }
}