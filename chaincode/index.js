'use strict';
//Users Organization
const userContract = require('./user-contract.js');

//Registrar Organization
const registrarContract = require('./registrar-contract.js');

//Export the contracts
module.exports.contracts = [userContract, registrarContract];