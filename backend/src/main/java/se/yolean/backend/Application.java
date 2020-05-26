package se.yolean.backend;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

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

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() {
        return "hello";
    }
}