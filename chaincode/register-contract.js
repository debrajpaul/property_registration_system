"use strict";

const { Contract, Context } = require("fabric-contract-api");

const User = require("./lib/models/user");
const Property = require("./lib/models/property");

const UserList = require("./lib/lists/userList");
const PropertyList = require("./lib/lists/propertyList");

class CertnetContext extends Context {
  constructor() {
    super();
    // Add various model lists to the context class object
    // this : the context instance
    this.userList = new UserList(this);
    this.propertyList = new PropertyList(this);
  }
}
/**
 * @description Smart contract for Registrar who plays important role in approving and auditing requests made by the user in the network
 */
class RegistrarContract extends Contract {
  /**
   * @description Initiate constructor with smart contract name for registrar
   */
  constructor() {
    // Provide a custom name to refer to this smart contract
    super("org.property-registration-network.regnet.registrar");
  }

  // Built in method used to build and return the context for this smart contract on every transaction invoke
  createContext() {
    return new CertnetContext();
  }

  /**
   * @description Method will be called while instantiating the smart contract to print the success message on console and set few initial set of variables.
   * @param {*} ctx - Transaction context object
   */
  async instantiate(ctx) {
    console.log("Smart Contract for Registrar Instantiated");
  }

  /**
   * @description Approve new user request made in the network by user
   * @param {*} ctx The transaction context object
   * @param {*} name Name of the user
   * @param {*} aadharId Aadhar Id of the user
   * @returns Updated user object
   */
  async approveNewUser(ctx, name, aadharId) {
    try {
      // Construct composite key for the given user account
      const userKey = User.makeKey([name, aadharId]);

      //fetch user details from ledger based on user request key generated above.
      let existingUser = await ctx.userList.getUser(userKey);

      // Make sure user does not already exist.
      if (!existingUser) {
        throw new Error(
          "Invalid aadhar ID: " +
            aadharId +
            ". A User with this ID does not exists."
        );
      }
      //If the user is already registered in the network reject the transaction
      if (existingUser.status === "Approved") {
        throw new Error(
          "Duplicate Request: User is already registered in the network, request will be rejected"
        );
      }
      existingUser.upgradCoins = parseInt(0);
      existingUser.updatedAt = new Date(); //For audit purpose
      existingUser.registrarId = ctx.clientIdentity.getID(); //For audit purpose and to identify who has approved the request
      existingUser.status = "Approved"; //To differentiate between approved and non-approved user.
      await ctx.userList.updateUser(existingUser);
      // Return value of new user account created to user
      return existingUser;
    } catch (error) {
      console.error("error! approveNewUser ->", error);
      return;
    }
  }

  /**
   * @description Method to view user details in the network
   * @param {*} ctx The transaction context object
   * @param {*} name Name of the user
   * @param {*} aadharId Aadhar Id of the user
   */
  async viewUser(ctx, name, aadharId) {
    // Create the composite key required to fetch record from blockchain
    const userKey = User.makeKey([name, aadharId]);

    // Return value of student account from blockchain
    return await ctx.userList.getUser(userKey);
  }

  /**
   * @description Approve the property registration request by the user.  This makes property status as 'registered' which means the property is trusted property in the network
   * @param {*} ctx The transaction context object
   * @param {*} propertyId Unique property id of the property
   * @returns Updated property detail
   */
  async approvePropertyRegistration(ctx, propertyId) {
    try {
      //create composite key for the details given property
      const propertyKey = Property.makeKey([propertyId]);

      //using composite key fetch the current state of property object and return
      let propertyObject = await ctx.propertyList.getProperty(propertyKey);

      //Update property object with few more details
      propertyObject.status = "registered";
      propertyObject.approvedBy = ctx.clientIdentity.getID();
      propertyObject.updatedAt = new Date();

      //update property details in ledger.
      await ctx.propertyList.updateProperty(propertyKey, propertyObject);

      // Returns updated property object
      return propertyObject;
    } catch (error) {
      console.error("error! approvePropertyRegistration ->", error);
      return;
    }
  }

  /**
   * @description View property details available in the network.
   * @param {*} ctx The transaction context object
   * @param {*} propertyId Unique property id of the property
   * @returns Property details available in the network
   */
  async viewProperty(ctx, propertyId) {
    //create composite key for the details given property
    const propertyKey = Property.makeKey([propertyId]);

    //using composite key fetch the current state of property object and return
    return await ctx.propertyList.getProperty(propertyKey);
  }
}

//Export the class as module
module.exports = RegistrarContract;
