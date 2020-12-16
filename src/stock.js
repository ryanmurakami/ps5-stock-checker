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
      await sendNotification(process.env.checkUrl, status)
      console.log('Notification sent! Hope you beat the bots!')
    }
  } catch (err) {
    console.error(err)
  }
}

async function checkStock (page) {
  const el = await page.$(`*[data-sku-id="${process.env.sku}"]`)
  const buttonText = await (await el.getProperty('textContent')).jsonValue()

  return !['Sold Out', 'Coming Soon', 'Check Stores'].includes(buttonText) ? buttonText : false
}

async function sendNotification (url, state) {
  const params = {
    Message: `PS5 is ${state} at Best Buy! Go get it! ${url}`,
    TopicArn: process.env.topic
  }

  return sns.publish(params).promise()
}