'use-strict'

require('dotenv').config()

module.exports = {
   db: {
      mongodbUrl: process.env.DB_MONGODB_URL || 'mongodb://localhost:27017/TriggerService',
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
   },
}
