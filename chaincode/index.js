'use strict';
//Users Organization
const userContract = require('./user-contract');

//Registrar Organization
const registrarContract = require('./register-contract');

//Export the contracts
module.exports.contracts = [userContract, registrarContract];