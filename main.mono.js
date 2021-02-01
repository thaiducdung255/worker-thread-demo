'use-strict'

const { connect } = require('mongoose')

const { db, worker } = require('./config')
const Campaign = require('./campaign.model')
const Customer = require('./customer.model')
const { sleep, getMixedCustomerChunk, autoCall } = require('./helper')

connect(db.mongodbUrl, db.options, async (err) => {
   if (err) {
      process.stdout.write(`mongodb error: ${err.toString()}\n`)
   }

   let isIdle = true
   // eslint-disable-next-line no-constant-condition
   while (true) {
      const now = new Date()
      now.setHours(now.getHours() + 7)
      const nowStrs = now.toISOString().split('T')
      const currentTime = nowStrs[1].slice(0, 5)
      const currentDate = nowStrs[0]

      if (currentTime >= '07:00' && currentTime <= '21:00') {
         if (isIdle) {
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

            if (validCampaigns.length) {
               isIdle = false
               let customerChunk = []
               const sucessCallIds = []

               do {
                  // eslint-disable-next-line no-await-in-loop
                  customerChunk = await getMixedCustomerChunk(validCampaigns)
                  console.log({ cuslen: customerChunk.lenth })

                  for (let i = 0; i < customerChunk.lenth; i += 1) {
                     const customer = customerChunk[i]
                     // eslint-disable-next-line no-await-in-loop
                     const isCalled = await autoCall(customer)
                     if (isCalled) sucessCallIds.push(customer._id)
                     sleep(worker.callIntervalMs)
                  }

                  if (sucessCallIds.length) {
                     // eslint-disable-next-line no-await-in-loop
                     const updateRes = await Customer.updateMany({
                        _id: { $in: sucessCallIds },
                     },
                     {
                        isCalled: true,
                     })

                     console.log({ updateRes })
                  }

                  sleep(worker.chunkDelayMs)
               } while (customerChunk.length)

               isIdle = true
            } else {
               isIdle = true
            }
         }
      }

      sleep(worker.checkIntervalMs)
   }
})
