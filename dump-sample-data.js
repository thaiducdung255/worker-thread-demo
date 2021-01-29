'use-strict'

const mongoose = require('mongoose')

const { db } = require('./config')
const Campaign = require('./campaign.model')
const Customer = require('./customer.model')

function randomPhoneNumber() {
   return Math.random().toString().slice(2, 14)
}

function randomName(phoneNumber = randomPhoneNumber()) {
   return String.fromCharCode(
      ...phoneNumber.split('').map((number) => Number(number) + 65),
   )
}

async function genRandomCampaigns(size = 10) {
   const campaigns = []

   for (let i = 0; i < size; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const campaign = new Campaign({
         name: randomName(),
         fromTime: '06:00',
         toTime: '17:00',
         fromExcludedTime: '11:50',
         toExcludedTime: '13:00',
         fromDate: '2021-01-01',
         toDate: '2021-04-01',
         // eslint-disable-next-line no-template-curly-in-string
         template: 'FPT Telecom kinh chao quy khach ${_id}, chung toi xin thong bao hop dong ${extraInfo.contract} da den han thanh toan voi ma ${extraInfo.billNumber}.',
         isEnabled: true,
      })

      campaigns.push(campaign)
   }

   await Campaign.insertMany(campaigns)
   return campaigns
}

async function genRandomCustomers(campaignId, size = 100) {
   const customers = []

   for (let i = 0; i < size; i += 1) {
      customers.push({
         campaign: campaignId,
         phoneNumber: randomPhoneNumber(),
         extraInfo: {
            billNumber: randomName(),
            contract: randomName(),
         },
         isCalled: false,
      })
   }

   await Customer.insertMany(customers)
}

async function refreshAllCalledCustomers() {
   await Customer.updateMany({ isCalled: true }, { isCalled: false })
}

async function truncateDb() {
   await Campaign.deleteMany({})
   await Customer.deleteMany({})
}

mongoose.connect(db.mongodbUrl, db.options, async (err) => {
   if (err) return process.stdout.write(`err: ${err.toString()}`)

   await truncateDb()
   const campaigns = await genRandomCampaigns()
   const customerPromises = campaigns.map((campaign) => genRandomCustomers(campaign._id.toString()))
   await Promise.all(customerPromises)
   mongoose.disconnect()
})
