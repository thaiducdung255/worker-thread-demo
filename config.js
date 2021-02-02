'use-strict'

require('dotenv').config()

let mongoUrl = ''
const mongoUsername = process.env.DB_MONGODB_USERNAME
const mongoPassword = process.env.DB_MONGODB_PASSWORD
const mongoHost = process.env.DB_MONGODB_HOST || 'localhost'
const mongoPort = process.env.DB_MONGODB_PORT || 27017
const mongoDbName = process.env.DB_MONGODB_DB_NAME || 'TriggerService'

if (mongoUsername && mongoPassword) {
   mongoUrl = `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDbName}`
} else {
   mongoUrl = `mongodb://${mongoHost}:${mongoPort}/${mongoDbName}`
}

module.exports = {
   db: {
      mongoUrl,
      options: {
         useNewUrlParser: true,
         useUnifiedTopology: true,
      },
   },
   api: {
      autoCall: {
         url: process.env.API_AUTO_CALL_URL || 'http://localhost:3210/call',
         keys: JSON.parse(process.env.API_AUTO_CALL_KEYS || '[]'),
      },
   },
   worker: {
      callIntervalMs: Number(process.env.WORKER_CALL_INTERVAL_MS) || 500,
      chunkDelayMs: Number(process.env.WORKER_CHUNK_DELAY_MS) || 3000,
      chunkSize: Number(process.env.WORKER_CHUNK_SIZE) || 100,
      checkIntervalMs: Number(process.env.WORKER_CHECK_INTERVAL_MS) || 3000,
   },
}
