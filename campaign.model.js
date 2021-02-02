'use-strict'

const { Schema, model } = require('mongoose')

module.exports = model('Campaign', new Schema({
   name: String,
   fromTime: String,
   toTime: String,
   fromExcludedTime: String,
   toExcludedTime: String,
   fromDate: String,
   toDate: String,
   template: String,
   isEnabled: Boolean,
   provider: String,
}), 'campaigns')
