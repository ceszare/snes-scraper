/*
  Loads external dependencies
*/
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

/*
  Loads environment variable constants
*/
const WALMART_URI = process.env.walmartUri;
const USER_AGENT = process.env.userAgent;
const MAKER_URI = process.env.makerWebhookUri;

module.exports = function (context, walmartScraper) {
    if(walmartScraper.isPastDue)
    {
        context.log('JavaScript is running late!');
    }

    request({
        url: WALMART_URI,
        timeout: 10000,
        headers: {
            'User-Agent': USER_AGENT
        }
    }, handleWalmartPageLoad);

    function handleWalmartPageLoad(error, response, html) {
        if (!error) {
            let $ = cheerio.load(html);
            let orderButton = $('.prod-ProductPrimaryCTA button');
            if (orderButton.length === 0) {
                context.log('The item hasn\'t been set for pre-order yet.');
            } else if (orderButton.length > 1){
                context.log.warn('Unexpected state, as there should be at most one order button.');
            } else {
                let orderButtonText = orderButton.text();
                switch(orderButtonText) {
                case 'Preorder':
                case 'Add to Cart':
                    context.log('The product status has changed to ' + orderButtonText + ' and can now be bought.');
                    request({
                        url: MAKER_URI,
                        method: 'POST',
                        json: true,
                        body: {
                            'value1': 'Walmart',
                            'value2': orderButtonText,
                            'value3': WALMART_URI
                        }
                    });
                    break;
                default:
                    context.log.warn('An unexpected state was detected in the button', addToCartButtonState);
                }
            }
        } else {
            context.log.error(error);
        }
    }
};