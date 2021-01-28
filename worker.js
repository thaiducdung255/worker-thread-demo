'use-strict'

const { connect, Types } = require('mongoose')

const { parentPort, workerData } = require('worker_threads')
const axios = require('axios')

const Customer = require('./customer.model')
const { sleep } = require('./helper')
const { db } = require('./config')

const { toExcludedTime, fromExcludedTime } = workerData

function autoCall(customer) {
   // perform auto call
   return new Promise((resolve) => {
      console.log({ call_to_customer: customer._id })
      const requestBody = {
         phoneNumber: workerData.phoneNumber,
         text: 'sample text',
         voice: 'female_south',
      }

      axios.post('http://localhost:3210/call', requestBody).then((res) => {
         if (res.status !== 200) resolve(false)
         resolve(true)
      }).catch((err) => {
         resolve(false)
      })
   })
}

function getCustomerChunk(campaignId, size = 200) {
   return Customer.find({
      isCalled: false,
      campaign: Types.ObjectId(campaignId),
   }).limit(size).lean()
}

connect(db.mongodbUrl, db.options, async () => {
   do {
      const now = new Date()
      now.setHours(now.getHours() + 7)
      const currentTime = now.toISOString().split('T')[1]

      if (currentTime > toExcludedTime || currentTime < fromExcludedTime) {
         // eslint-disable-next-line no-await-in-loop
         const customers = await getCustomerChunk((workerData._id).toString())

         const sucessCallIds = []
         parentPort.postMessage(customers.length)

         for (let i = 0; i < customers.length; i += 1) {
            const customer = customers[i]
            // eslint-disable-next-line no-await-in-loop
            const isCalled = await autoCall(customer)
            if (isCalled) sucessCallIds.push(customer._id)
            sleep(3000)
         }

         // eslint-disable-next-line no-await-in-loop
         const updateRes = await Customer.updateMany({
            _id: { $in: sucessCallIds },
         },
         {
            isCalled: true,
         })
         console.log({ updateRes: updateRes.nModified }, 'heap used: ', Math.floor(process.memoryUsage().heapUsed / 1024 / 1024))
      }
      sleep()
      console.log({ heap: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) })
   // eslint-disable-next-line no-constant-condition
   } while (true)
})
