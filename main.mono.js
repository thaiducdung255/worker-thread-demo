'use-strict'

const { connect } = require('mongoose')

const { db, worker } = require('./config')
const Campaign = require('./campaign.model')
const Customer = require('./customer.model')
const { sleep, getMixedCustomerChunk, autoCall } = require('./helper')

connect(db.mongoUrl, db.options, async (err) => {
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

            const campaignDict = {}

            validCampaigns.forEach((campaign) => {
               campaignDict[campaign._id] = campaign
            })

            if (validCampaigns.length) {
               isIdle = false
               let customerChunk = []
               let successCallIds = []

               do {
                  // eslint-disable-next-line no-await-in-loop
                  customerChunk = await getMixedCustomerChunk(validCampaigns)

                  for (let i = 0; i < customerChunk.length; i += 1) {
                     const customer = customerChunk[i]
                     // eslint-disable-next-line no-await-in-loop
                     const isCalled = await autoCall(customer, campaignDict[customer.campaign])
                     if (isCalled) successCallIds.push(customer._id)
                     sleep(worker.callIntervalMs)
                  }

                  if (successCallIds.length) {
                     // eslint-disable-next-line no-await-in-loop
                     const updateRes = await Customer.updateMany({
                        _id: { $in: successCallIds },
                     },
                     {
                        isCalled: true,
                     })

                     console.log({ updateRes })
                     successCallIds = []
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
