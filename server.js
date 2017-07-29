/*
 Loads external dependencies
*/
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36';

const BESTBUY_URI = 'http://www.bestbuy.com/site/nintendo-entertainment-system-snes-classic-edition/5919830.p';
const BESTBUY_REQUEST_COOKIE_HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Upgrade-Insecure-Requests': 1,
    'Accept-Language': 'en-US,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Connection': 'keep-alive',
    'Host': 'www.bestbuy.com',
    'User-Agent': USER_AGENT
};


let options = {
    url: BESTBUY_URI,
    headers: BESTBUY_REQUEST_COOKIE_HEADERS,
    timeout: 10000
};

let isWorkflowSuccessful = false;

// Performs a request for BestBuy
request( options, handleBestBuyScrapeCookies);

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
        console.error(error);
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
        // console.log($('button#notify-in-stock-btn').first().text());
        let addToCartButtonState = $('#pdp-add-to-cart-button .cart-button').first().attr('data-button-state-id');
        switch(addToCartButtonState) {
        case 'ADD_TO_CART':
            console.log('Add to cart');
            // Buy now!!!
            break;
        case 'COMING_SOON':
            console.log('Not yet');
            // Expected case. Ignore
            break;
        default:
            console.error('Unexpected situation');
            // Unexpected case. Log it to handle it later.
            break;
        }
        isWorkflowSuccessful = true;
    } else {
        console.error(error);
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