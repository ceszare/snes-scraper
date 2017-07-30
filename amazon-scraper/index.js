/*
  Loads external dependencies
*/
const request = require('request');
const cheerio = require('cheerio');

/*
  Loads environment variable constants
*/
const AMAZON_URI = process.env.amazonUri;
const USER_AGENT = process.env.userAgent;
const MAKER_URI = process.env.makerWebhookUri;

module.exports = function (context, amazonScraper) {
    if(amazonScraper.isPastDue)
    {
        context.log('JavaScript is running late!');
    }

    request({
        url: AMAZON_URI,
        timeout: 10000,
        headers: {
            'User-Agent': USER_AGENT
        }
    }, handleAmazonPageLoad);

    function handleAmazonPageLoad(error, response, html) {
        if (!error) {
            let $ = cheerio.load(html);
            let orderButton = $('#add-to-cart-button');
            if (orderButton.length === 0) {
                context.log('The item hasn\'t been set for pre-order yet.');
            } else if (orderButton.length > 1){
                context.log.warn('Unexpected state, as there should be at most one order button.');
            } else {
                let orderButtonText = orderButton.first().attr('value');
                if (orderButtonText.indexOf('Pre-order') === 0 || orderButtonText === 'Add to Cart') {
                    context.log(`The product status has changed to ${orderButtonText} and can now be bought.`);
                    request({
                        url: MAKER_URI,
                        method: 'POST',
                        json: true,
                        body: {
                            'value1': 'Amazon',
                            'value2': orderButtonText,
                            'value3': AMAZON_URI
                        }
                    });
                } else {
                    context.log.warn('An unexpected state was detected in the button', orderButtonText);
                }
            }
        } else {
            context.log.error(error);
        }
        context.done();
    }
}
