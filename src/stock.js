const chromium = require('chrome-aws-lambda')
const AWS = require('aws-sdk')

const sns = new AWS.SNS()

module.exports.check = async event => {
  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })

    const page = await browser.newPage()
    await page.goto(process.env.checkUrl)
    const status = await checkStock(page)
    const statusMsg = 'Status of PS5 stock is: ' + (status ? 'In Stock' : 'Out of Stock')
    console.log(new Date().toISOString())
    console.log(statusMsg)
    if (status) {
      await sendNotification(process.env.checkUrl)
      console.log('Notification sent! Hope you beat the bots!')
    }
  } catch (err) {
    console.error(err)
  }
}

async function checkStock (page) {
  const el = await page.$('.add-to-cart-button')
  const buttonText = await (await el.getProperty('textContent')).jsonValue()
  return buttonText !== 'Sold Out'
}

async function sendNotification (url) {
  const params = {
    Message: `PS5 is in stock at Best Buy! Go get it! ${url}`,
    TopicArn: process.env.topic
  }

  return sns.publish(params).promise()
}