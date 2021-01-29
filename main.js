'use-strict'

const { connect } = require('mongoose')
const { Worker } = require('worker_threads')
const { resolve } = require('path')

const { db } = require('./config')
const Campaign = require('./campaign.model')

connect(db.mongodbUrl, db.options, (err) => {
   if (err) {
      process.stdout.write(`mongodb error: ${err.toString()}\n`)
   }

   let workers = []
   // eslint-disable-next-line no-constant-condition
   setInterval(async () => {
      const now = new Date()
      now.setHours(now.getHours() + 7)
      const nowStrs = now.toISOString().split('T')
      const currentTime = nowStrs[1].slice(0, 5)
      const currentDate = nowStrs[0]

      if (currentTime >= '07:00' && currentTime <= '21:00') {
         if (!workers.length) {
            // eslint-disable-next-line no-await-in-loop
            const validCampaigns = await Campaign.find({
               fromDate: {
                  $lte: currentDate,
               },
               toDate: {
                  $gte: currentDate,
               },
               isEnabled: true,
            }).lean()

            // eslint-disable-next-line no-loop-func
            validCampaigns.forEach((validCampaign, workerId) => {
               process.stdout.write(`forking worker: ${validCampaign.name}\n`)

               const worker = new Worker(
                  resolve(__dirname, 'worker.js'),
                  {
                     workerData: {
                        ...validCampaign,
                        _id: validCampaign._id.toString(),
                        workerId,
                     },
                  },
               )

               workers.push(worker)

               worker.on('online', () => {
                  process.stdout.write(`worker ${worker.threadId} is online\n`)
               })

               worker.on('message', (message) => {
                  process.stdout.write(`[${worker.threadId}]: ${message}\n`)
               })

               worker.on('exit', (code) => {
                  process.stdout.write(`worker ${worker.threadId} is exited: ${code}\n`)
               })

               worker.on('error', (error) => {
                  process.stdout.write(`worker ${worker.threadId} is error: ${error}\n`)
               })
            })
         }
      } else if (workers.length) {
         process.stdout.write('terminating workers\n')
         workers.forEach((worker) => worker.terminate())
         workers = []
      }
   }, 2000)
})
