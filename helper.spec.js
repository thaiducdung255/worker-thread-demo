/* eslint-disable no-undef */
const {
   sleep, awakenCallTemplate,
} = require('./helper')

test('sleep function should work well with default parameters', () => {
   const now = Date.now()
   expect(sleep()).toBeUndefined()
   expect(Date.now() - now).toBeGreaterThanOrEqual(1000)
   expect(Date.now() - now).toBeLessThanOrEqual(1010)
})

test('sleep function should pause the program if the duration is a positive number', () => {
   const now = Date.now()
   expect(sleep(500)).toBeUndefined()
   expect(Date.now() - now).toBeGreaterThanOrEqual(500)
   expect(Date.now() - now).toBeLessThanOrEqual(510)
})

test('sleep function should now pause the program if the duration is a negative number', () => {
   const now = Date.now()
   expect(sleep(-99)).toBeUndefined()
   expect(Date.now() - now).toBeGreaterThanOrEqual(0)
   expect(Date.now() - now).toBeLessThanOrEqual(10)
})

test('sleep function should now pause the program if the duration is zero', () => {
   const now = Date.now()
   expect(sleep(0)).toBeUndefined()
   expect(Date.now() - now).toBeGreaterThanOrEqual(0)
   expect(Date.now() - now).toBeLessThanOrEqual(10)
})

test('awakenCallTemplate function should work well with default parameters', () => {
   // eslint-disable-next-line no-template-curly-in-string
   const test = expect(awakenCallTemplate())
   test.toBe('')
})

test('awakenCallTemplate function should remove undefined property', () => {
   // eslint-disable-next-line no-template-curly-in-string
   const templateStr = 'this is a sample str: ${name} with ${extraInfo.bill_} and ${unresolved}'
   const customer = {
      name: 'dungtd10',
      extraInfo: {
         bill_: 'HD11220900',
      },
   }

   const test = expect(awakenCallTemplate(templateStr, customer))
   test.toBe('this is a sample str: dungtd10 with HD11220900 and ')
})

test('awakenCallTemplate function should return a correct string', () => {
   // eslint-disable-next-line no-template-curly-in-string
   const templateStr = 'this is a sample str: ${name} with ${extraInfo.bill_}'
   const customer = {
      name: 'dungtd10',
      extraInfo: {
         bill_: 'HD11220900',
      },
   }

   const test = expect(awakenCallTemplate(templateStr, customer))
   test.toBe('this is a sample str: dungtd10 with HD11220900')
})

test('awakenCallTemplate function should ignore property that cause error', () => {
   // eslint-disable-next-line no-template-curly-in-string
   const templateStr = 'this is a sample str: ${name} with ${extraInfo.bill_name} and ${notExistKey.key}'
   const customer = {
      name: 'dungtd11',
      extraInfo: {
         bill_name: 'HD11220901',
      },
   }

   const test = expect(awakenCallTemplate(templateStr, customer))
   test.toBe('this is a sample str: dungtd11 with HD11220901 and ')
})
