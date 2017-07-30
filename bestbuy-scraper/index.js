/*
  Loads external dependencies
*/
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

/*
  Loads environment variable constants
*/
const BESTBUY_URI = process.env.bestBuyUri;
const USER_AGENT = process.env.userAgent;
const MAKER_URI = process.env.makerWebhookUri;

module.exports = function (context, bestbuyScraper) {
    if(bestbuyScraper.isPastDue)
    {
        context.log('JavaScript is running late!');
    }

    request({
            url: BESTBUY_URI,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Upgrade-Insecure-Requests': 1,
                'Accept-Language': 'en-US,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Connection': 'keep-alive',
                'Host': 'www.bestbuy.com',
                'User-Agent': USER_AGENT
            },
            timeout: 10000
        }, handleBestBuyScrapeCookies);

    /**
     * Performs a lookup for the `set-cookie` header required by Best Buy in order to perform a
     * search on a given product. When found, it will proceed to perform a query on the URI after
     * assembling the cookie required for the display page to be shown.
     *
     * @param {Object} error - If there is an error on the request, the details will be stored here.
     * @param {Object} response - Contains an instance of the httpResponse object, from which we will extract the `setCookie` header
     */
    function handleBestBuyScrapeCookies(error, response) {
        if (!error) {
            let bbCookie = _.reduce(_.map(response.headers['set-cookie'], getBestBuyCookieValue), combineBestBuyCookies);
            request({
                url: BESTBUY_URI,
                headers: {
                    'Cookie': bbCookie,
                    'User-Agent': USER_AGENT
                },
                timeout: 10000
            }, handleBestBuyScrapeProduct);
        } else {
            context.log.error(error);
            context.done();
        }
    }

    /**
     * Performs a query for Best Buy's SNES Classic page, in order to determine if the product
     * has been released for sale.
     *
     * @param {*} error 
     * @param {*} response 
     * @param {*} html 
     */
    function handleBestBuyScrapeProduct(error, response, html) {
        if (!error) {
            let $ = cheerio.load(html);
            let addToCartButtonState = $('#pdp-add-to-cart-button .cart-button').first().attr('data-button-state-id');
            switch(addToCartButtonState) {
            case 'ADD_TO_CART':
                context.log('The product status has changed and can now be bought.');
                request({
                    url: MAKER_URI,
                    method: 'POST',
                    json: true,
                    body: {
                        'value1': 'Best buy'
                    }
                });
                break;
            case 'COMING_SOON':
                context.log('No changes registered in the service yet.');
                break;
            default:
                context.log.warn('An unexpected state was detected in the button', addToCartButtonState);
                break;
            }
            context.done();
        } else {
            context.log.error(error);
            context.done();
        }
    }

    /**
     * Best buy provides a set of cookies that need to be passed as a header in order
     * to visualize a product on their website. This function extracts the value from
     * each cookie that needs to be concatenated so that the request may go through and
     * display the website's data.
     * 
     * @param {String} cookie - An raw entry within the `set-cookie` header to be sanitized
     * @returns {String} The sanitized string
     */
    function getBestBuyCookieValue(cookie) {
        return cookie.split(';')[0];
    }

    /**
     * A reducer that will concatenate all the partial cookies into a string that joins them
     * via the '; ' suffix.
     *
     * @param {String} str - The aggregated string formed by all the items in the collection
     * @param {String} entry - The entry to be aggregated by the reducer
     * @returns {String} An aggregated string representing all the values in the collection.
     */
    function combineBestBuyCookies(str, entry) {
        return `${entry}; ${str}`;
    }
};