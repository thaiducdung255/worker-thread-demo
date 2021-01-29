'use-strict'

const { connect } = require('mongoose')

const { db, worker } = require('./config')
const Campaign = require('./campaign.model')
const Customer = require('./customer.model')
const { sleep, getMixedCustomerChunk } = require('./helper')

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
               const campaignIds = []
               const campaignDict = {}

               // eslint-disable-next-line no-loop-func
               validCampaigns.forEach((validCampaign) => {
                  campaignIds.push(validCampaign._id.toString())
                  campaignDict[validCampaign._id] = validCampaign
               })

               let customerChunk = []

               // eslint-disable-next-line no-constant-condition
               while (true) {
                  // eslint-disable-next-line no-await-in-loop
                  customerChunk = await getMixedCustomerChunk(campaignIds)
               }
            } else {
               isIdle = true
            }
         }
      }

      sleep(worker.checkIntervalMs)
   }
})
