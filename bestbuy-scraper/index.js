module.exports = function (context, bestbuyScraper) {
    var timeStamp = new Date().toISOString();
    
    if(bestbuyScraper.isPastDue)
    {
        context.log('JavaScript is running late!');
    }
    context.log(`This is the uri to ping: ${process.env.bestBuyUri}`, timeStamp);   
    
    context.done();
};