'use-strict'

const { workerData, parentPort } = require('worker_threads')
const { Types } = require('mongoose')
const axios = require('axios')
const { api, worker } = require('./config')

const Customer = require('./customer.model')

function sleep(durationMs = 1000) {
   const now = Date.now()
   if (durationMs < 0) return
   // eslint-disable-next-line no-empty
   while (Date.now() - now < durationMs) {}
}

// eslint-disable-next-line no-unused-vars
function awakenCallTemplate(callTemplateStr = '', customer = {}) {
   let actualStr = callTemplateStr
   const parameters = callTemplateStr.match(/\${[a-zA-Z0-9.\-_]*}/g)

   if (parameters) {
      parameters.forEach((parameter) => {
         // eslint-disable-next-line no-eval
         const actualValue = eval('customer.'.concat(parameter.slice(2, -1))) || ''
         actualStr = actualStr.replace(parameter, actualValue)
      })
   }

   return actualStr
}

function autoCall(customer = {}) {
   // perform auto call
   return new Promise((resolve) => {
      const requestBody = {
         phone: customer.phoneNumber,
         provider: workerData.provider || 'mobile',
         text: awakenCallTemplate(workerData.template, customer),
         voice: 'female_south',
         key: api.autoCall.keys[workerData.workerId] || api.autoCall.keys[0],
      }

      parentPort.postMessage(`cus_id: ${customer._id} ${requestBody.key}`)
      axios.post(api.autoCall.url, requestBody).then((res) => {
         if (res.status !== 200 || res.data?.success !== 'true') {
            resolve(false)
         }

         resolve(true)
      }).catch((err) => {
         resolve(false)
      })
   })
}

function getCustomerChunk(campaignId, size = worker.chunkSize) {
   return Customer.find({
      isCalled: false,
      campaign: Types.ObjectId(campaignId),
   }).limit(size).lean()
}

async function getMixedCustomerChunk(campaigns = [], size = worker.chunkSize) {
   const now = new Date()
   now.setHours(now.getHours() + 7)
   const exactCurrentTime = now.toISOString().split('T')[1].slice(0, 5)

   const validCampaigns = campaigns.filter((campaign) => {
      const {
         fromTime, toTime,
      } = campaign

      const fromExcludedTime = campaign.fromExcludedTime || campaign.toTime
      const toExcludedTime = campaign.toExcludedTime || campaign.fromTime

      const firstCondition = fromTime <= exactCurrentTime && fromExcludedTime > exactCurrentTime
      const secondCondition = toExcludedTime <= exactCurrentTime && toTime > exactCurrentTime
      return firstCondition || secondCondition
   })

   console.log({ all: campaigns.length, valid: validCampaigns.length })
   console.log({ ids: validCampaigns.map((campaign) => Types.ObjectId(campaign._id)) })

   return Customer.find({
      isCalled: false,
      campaign: {
         $in: validCampaigns.map((campaign) => Types.ObjectId(campaign._id)),
      },
   }).limit(size).lean()
}

module.exports = {
   sleep,
   getCustomerChunk,
   autoCall,
   awakenCallTemplate,
   getMixedCustomerChunk,
}
