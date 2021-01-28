'use-strict'

function sleep(durationMs = 1000) {
   const now = Date.now()
   if (durationMs < 0) return
   // eslint-disable-next-line no-empty
   while (Date.now() - now < durationMs) {}
}

module.exports = { sleep }
