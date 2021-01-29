'use-strict'

require('dotenv').config()

module.exports = {
   db: {
      mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/TriggerService',
      options: {
         useNewUrlParser: true,
         useUnifiedTopology: true,
      },
   },
   api: {
      autoCall: {
         url: process.env.AUTO_CALL_URL || 'http://localhost:3210',
      },
   },
}
