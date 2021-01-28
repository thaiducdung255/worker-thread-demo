'use-strict'

const { Schema, model } = require('mongoose')

module.exports = model(
   'Customer',
   new Schema({
      phoneNumber: String,
      isCalled: Boolean,
      extraInfo: Object,
      isSuccessCall: Boolean,
   }),
   'customers',
)
