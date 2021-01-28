'use-strict'

const { connect } = require('mongoose')
const { Worker } = require('worker_threads')
const { resolve } = require('path')

const { db } = require('./config')
const Campaign = require('./campaign.model')

connect(db.mongodbUrl, db.options, (err) => {
   if (err) {
      console.log(73, { err })
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
            validCampaigns.forEach((validCampaign) => {
               console.log(45, 'forking workers', validCampaign)

               const worker = new Worker(
                  resolve(__dirname, 'worker.js'),
                  {
                     workerData: {
                        ...validCampaign,
                        _id: validCampaign._id.toString(),
                     },
                  },
               )

               workers.push(worker)

               worker.on('online', () => {
                  console.log('worker is online')
               })

               worker.on('message', (message) => {
                  console.log(`worker send a message: ${message}`)
               })

               worker.on('exit', (code) => {
                  console.log(`worker is exited: ${code}`)
               })

               worker.on('error', (error) => {
                  console.log(`worker is error: ${error}`)
               })
            })
         }
      } else if (workers.length) {
         console.log(52, 'terminating workers')
         workers.forEach((worker) => worker.terminate())
         workers = []
      }
   }, 2000)
})
