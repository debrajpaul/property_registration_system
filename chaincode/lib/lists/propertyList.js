"use strict";

const Property = require("../models/property");

class PropertyList {
  constructor(ctx) {
    this.ctx = ctx;
    this.name = "org.property-registration-network.regnet.lists.property"; // need to change
  }

  /**
   * Returns the Property model stored in blockchain identified by this key
   * @param propertyKey
   * @returns {Promise<Property>}
   */
  async getProperty(propertyKey) {
    let propertyCompositeKey = this.ctx.stub.createCompositeKey(
      this.name,
      propertyKey.split(":")
    );
    let propertyBuffer = await this.ctx.stub.getState(propertyCompositeKey);
    return Property.fromBuffer(propertyBuffer);
  }

  /**
   * Adds a property model to the blockchain
   * @param propertyObject {Property}
   * @returns {Promise<void>}
   */
  async addProperty(propertyObject) {
    let propertyCompositeKey = this.ctx.stub.createCompositeKey(
      this.name,
      propertyObject.getKeyArray()
    );
    let propertyBuffer = propertyObject.toBuffer();
    await this.ctx.stub.putState(propertyCompositeKey, propertyBuffer);
  }

  /**
   * Updates a property model on the blockchain
   * @param propertyObject {Property}
   * @returns {Promise<void>}
   */
  async updateProperty(propertyObject) {
    let propertyCompositeKey = this.ctx.stub.createCompositeKey(
      this.name,
      key.split(":")
    );
    let propertyBuffer = propertyObject.toBuffer();
    await this.ctx.stub.putState(propertyCompositeKey, propertyBuffer);
  }
}

module.exports = PropertyList;
