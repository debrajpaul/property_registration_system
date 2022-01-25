"use strict";

/**
 * Property class
 */

class Property {
  /**
   * Constructor function
   * @param propertyObject
   */
  constructor(propertyObject) {
    this.key = Property.makeKey([propertyObject.propertyId]);
    Object.assign(this, propertyObject);
  }

  /**
   * Get class of this model
   * @returns {string}
   */
  static getClass() {
    return "org.property-registration-network.regnet.models.property"; // need to change
  }

  /**
   * Convert the buffer stream received from blockchain into an object of this model
   * @param buffer {Buffer}
   */
  static fromBuffer(buffer) {
    let json = JSON.parse(buffer.toString());
    return new Property(json);
  }

  /**
   * Convert the object of this model to a buffer stream
   * @returns {Buffer}
   */
  toBuffer() {
    return Buffer.from(JSON.stringify(this));
  }

  /**
   * Create a key string joined from different key parts
   * @param keyParts {Array}
   * @returns {*}
   */
  static makeKey(keyParts) {
    return keyParts.map((part) => JSON.stringify(part)).join(":");
  }

  /**
   * Return key parts for instance of this model
   * @returns {Array}
   */
  getKeyArray() {
    return this.key.split(":");
  }

  /**
   * Create a new instance of this model
   * @returns {Property}
   * @param propertyObject {Object}
   */
  static createInstance(propertyObject) {
    return new Property(propertyObject);
  }
}

module.exports = Property;
