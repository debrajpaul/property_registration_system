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
 * @description Smart contract for Users Organization
 */
class UsersContract extends Contract {
  /**
   * @description Constructor method to initiate contract with unique name in the network
   */
  constructor() {
    // Name of the smart contract
    super("org.property-registration-network.regnet.users");
  }

  // Built in method used to build and return the context for this smart contract on every transaction invoke
  createContext() {
    return new CertnetContext();
  }

  /**
   * @description instantiate the smart contract
   * @param {*} ctx The transaction context object
   */
  async instantiate(ctx) {
    console.log("Smart Contract for User Instantiated");
  }

  /**
   * @description Request from user to register on the network
   * @param {*} ctx The transaction context object
   * @param {*} name Name of the user
   * @param {*} email Email ID of the user
   * @param {*} phoneNumber Phone number of the user
   * @param {*} aadharId Aadhar Id of the user
   * @returns Returns user request object
   */
  async requestNewUser(ctx, name, email, phoneNumber, aadharId) {
    try {
      // Create a new composite key for the new user account
      const userKey = User.makeKey([name, aadharId]);

      // Fetch user with given ID from blockchain
      let existingUser = await ctx.userList.getUser(userKey);

      // Make sure user does not already exist.
      if (existingUser !== undefined) {
        throw new Error(
          "Invalid aadhar ID: " +
            aadharId +
            ". A User with this ID already exists."
        );
      }

      // Create a new instance of user model and save it to blockchain
      const newUserObject = User.createInstance({
        name: name,
        email: email,
        phoneNumber: phoneNumber,
        aadharId: aadharId,
        userId: ctx.clientIdentity.getID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await ctx.userList.addUser(newUserObject);
      // Return value of new user account created to user
      return newUserObject;
    } catch (error) {
      console.error("error! requestNewUser ->", error);
      return;
    }
  }

  /**
   * @description Method to recharge the account with the upgradCoins.  Here the coin is retrieved from the bankTransactionId sent in the arguement
   * @param {*} ctx  The transaction context object
   * @param {*} name Name of the user
   * @param {*} aadharId  Aadhar Id of the user
   * @param {*} bankTransactionId mocked bank transaction id for this project
   * @returns Updated user detail in the network
   */
  async rechargeAccount(ctx, name, aadharId, bankTransactionId) {
    try {
      // Bank Transaction ID	with Number of upgradCoins
      const bankTxIdArray = [
        { id: "upg100", value: 100 },
        { id: "upg500", value: 500 },
        { id: "upg1000", value: 1000 },
      ];

      //Fetch upgradCoins based on the bank transaction id
      const txnDetails = bankTxIdArray.filter(
        (t) => t.id === bankTransactionId
      )[0];

      // Construct composite key for the given user account
      const userKey = User.makeKey([name, aadharId]);

      //fetch user details from ledger based on user request key generated above.
      let existingUser = await ctx.userList.getUser(userKey);

      // Make sure user does not already exist.
      if (!existingUser || !txnDetails) {
        //Decline the transaction if bank transaction id is invalid
        throw new Error("Invalid Transaction ID: " + bankTransactionId);
      }
      //If the user is already registered in the network reject the transaction
      if (existingUser.status !== "Approved") {
        throw new Error(
          "User should be registered in the network to recharge account"
        );
      }
      existingUser.upgradCoins =
        existingUser.upgradCoins + parseInt(txnDetails.value);
      existingUser.updatedAt = new Date();
      await ctx.userList.updateUser(existingUser);
      // Return value of new user account created to user
      return existingUser;
    } catch (error) {
      console.error("error! rechargeAccount ->", error);
      return;
    }
  }

  /**
   * @description View user details in the network
   * @param {*} ctx The transaction context object
   * @param {*} name Name of the user
   * @param {*} aadharId Aadhar Id of the user
   * @returns User object in the network if found, otherwise throws error
   */
  async viewUser(ctx, name, aadharId) {
    // Create the composite key required to fetch record from blockchain
    const userKey = User.makeKey([name, aadharId]);

    // Return value of student account from blockchain
    return await ctx.userList.getUser(userKey);
  }

  /**
   * @description Method to request to user's property to be registered in the network.
   * @param {*} ctx The transaction context object
   * @param {*} propertyId Unique property id of the property
   * @param {*} price Price of the property
   * @param {*} name Name of the user (owner) who want to register their property in the network
   * @param {*} aadharId Aadhar id of the user (owner) who want to register their property in the network
   * @returns Propety request object
   */
  async propertyRegistrationRequest(ctx, propertyId, price, name, aadharId) {
    try {
      //create composite key for the property detail given
      const userKey = User.makeKey([name, aadharId]);

      //fetch the user details from the ledger using composite key fetch the current state of user object and return
      let existingUser = await ctx.userList.getUser(userKey);

      //If the user is not registered in the network reject the transaction
      if (existingUser.status !== "Approved") {
        throw new Error("User is not registered in the network");
      }
      //user is valid, then register the property request in the ledger.
      // Create a property object to be stored in blockchain
      let propertyObject = {
        propertyId: propertyId,
        owner: userKey,
        price: parseInt(price),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Convert the JSON object to a buffer and send it to blockchain for storage
      const newPropertyObject = Property.createInstance(propertyObject);
      await ctx.propertyList.addProperty(newPropertyObject);

      // Return value of new property request requested by the user
      return newPropertyObject;
    } catch (error) {
      console.error("error! propertyRegistrationRequest ->", error);
      return;
    }
  }

  /**
   * @description View property details
   * @param {*} ctx The transaction context object
   * @param {*} propertyId Unique property id of the property
   */
  async viewProperty(ctx, propertyId) {
    //create composite key for the details given property
    const propertyKey = Property.makeKey([propertyId]);

    //using composite key fetch the current state of property object and return
    return await ctx.propertyList.getProperty(propertyKey);
  }

  /**
   * @description Method to update property status
   * @param {*} ctx The transaction context object
   * @param {*} propertyId Unique property id of the property
   * @param {*} name Name of the user who owns the property in the network
   * @param {*} aadharId Aadhar id of the user who owns the property in the network
   * @param {*} propertyStatus Property status to be updated
   */
  async updateProperty(ctx, propertyId, name, aadharId, propertyStatus) {
    try {
      //create composite key for the property given.
      const propertyKey = Property.makeKey([propertyId]);

      //create composite key for the user detail given
      const userKey = User.makeKey([name, aadharId]);

      //fetch user details from the ledger.
      let existingUser = await ctx.userList.getUser(userKey);

      if (existingUser.status !== "Approved") {
        throw new Error("Not authorized to update property ");
      }
      //fetch property details from the ledger.
      let propertyObject = await ctx.propertyList.getProperty(propertyKey);

      //check whether the owner of the property and the request initiator are same, then proceed.
      if (propertyObject.owner !== propertyKey) {
        throw new Error("Not authorized to update property ");
      }
      propertyObject.status = propertyStatus;

      //update property details in ledger.
      await ctx.propertyList.updateProperty(propertyKey, propertyObject);

      // Return value of new account created to user
      return propertyObject;
    } catch (error) {
      console.error("error! approveNewUser ->", error);
      return;
    }
  }

  /**
   * @// TODO: Check if buyer is same as seller then reject the request
   */
  /**
   * @description Method to purchase property request by registered buyer in the network.
   * @description Buyer will be allowed to purchase only if his/her account balance is > property price
   * @description Buyer will be allowed to purchase only if the property status is 'onSale'
   * @description If all the conditions are met, then updates buyer as owner of the property and returns the details of Property, Buyer and Seller
   * @param {*} ctx The transaction context object
   * @param {*} propertyId Unique property id which buyer wants to purchase
   * @param {*} buyerName name of the buyer who is registered in the network
   * @param {*} buyerAadharId Aadhar id of the buyer
   */
  async purchaseProperty(ctx, propertyId, buyerName, buyerAadharId) {
    //create composite key for property and fetch property details. Proceed further, if the property status is 'onsale'
    //create composite key for the buyer and check whether buyer is already registered in the network.
    const propertyKey = Property.makeKey([propertyId]);
    const buyerUserKey = User.makeKey([buyerName, buyerAadharId]);

    //fetch user details from the ledger.
    let buyerObject = await ctx.userList.getUser(buyerUserKey);

    //if the user is registered, then proceed.
    if (buyerObject.status !== "Approved") {
      throw new Error("User is not registered in the work");
    }
    //fetch property details from the ledger.
    let propertyObject = await ctx.propertyList.getProperty(propertyKey);

    //If the request made for current owner, it should be declined
    if (propertyObject.owner === propertyKey) {
      throw new Error(
        "Your request is invalid as you are already owner of this property"
      );
    }

    //If the property status is 'onSale' then prceed.
    if (propertyObject.status === "onSale") {
      throw new Error("Property is not for sale");
    }

    // check for mim balance
    if (buyerObject.upgradCoins < propertyObject.price) {
      throw new Error("No enough balance, please recharge your account");
    }
    let ownerUserKey = propertyObject.owner;
    console.log("OWNER UserKey", ownerUserKey);

    //fetch user details from the ledger.
    let ownerUser = await ctx.userList.getUser(ownerUserKey);

    //deduct property price from buyer account
    buyerObject.upgradCoins =
      parseInt(buyerObject.upgradCoins) - parseInt(propertyObject.price);
    buyerObject.updatedAt = new Date();

    //add property price to owner
    ownerUser.upgradCoins =
      parseInt(ownerUser.upgradCoins) + parseInt(propertyObject.price);
    ownerUser.updatedAt = new Date();

    //updated the ownwer of the property as buyer id, status as registered
    propertyObject.owner = buyerUserKey;
    propertyObject.status = "registered";
    propertyObject.updatedAt = new Date();

    //update property details in ledger
    await ctx.propertyList.updateProperty(propertyKey, propertyObject);

    //update buyer details in ledger.
    await ctx.userList.updateUser(buyerObject);

    //update owner details in ledger.
    await ctx.userList.updateUser(ownerUser);

    return propertyObject + buyerObject + ownerUser;
  }
}

module.exports = UsersContract;
