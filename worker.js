'use-strict'

const { connect } = require('mongoose')
const { parentPort, workerData } = require('worker_threads')

const Customer = require('./customer.model')
const {
   sleep, awakenCallTemplate, getCustomerChunk, autoCall,
} = require('./helper')
const { db, worker } = require('./config')

const { toTime, fromTime } = workerData
const fromExcludedTime = workerData.fromExcludedTime || null
const toExcludedTime = workerData.toExcludedTime || null

connect(db.mongoUrl, db.options, async () => {
   // eslint-disable-next-line no-constant-condition
   while (true) {
      const now = new Date()
      now.setHours(now.getHours() + 7)
      const currentTime = now.toISOString().split('T')[1]

      if (currentTime >= fromTime && currentTime <= toTime) {
         let isInvalidTime = true

         if (fromExcludedTime && toExcludedTime) {
            isInvalidTime = currentTime < fromExcludedTime || currentTime > toExcludedTime
         }

         if (isInvalidTime) {
            // eslint-disable-next-line no-await-in-loop
            const customers = await getCustomerChunk((workerData._id).toString(), worker.chunkSize)

            const sucessCallIds = []
            if (customers.length) parentPort.postMessage(`new chunk len: ${customers.length}`)

            for (let i = 0; i < customers.length; i += 1) {
               const customer = customers[i]
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

               parentPort.postMessage(`updateCount: ${updateRes.nModified}`)
            }
         }
      }
      sleep(worker.chunkDelayMs)
   }
})

module.exports = {
   getCustomerChunk,
   awakenCallTemplate,
   autoCall,
}
