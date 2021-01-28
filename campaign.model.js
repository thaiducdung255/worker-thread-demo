'use-strict'

const { Schema, model } = require('mongoose')

module.exports = model('Campaign', new Schema(), 'campaigns')
