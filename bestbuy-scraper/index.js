module.exports = function (context, bestbuyScraper) {
    var timeStamp = new Date().toISOString();
    
    if(bestbuyScraper.isPastDue)
    {
        context.log('JavaScript is running late!');
    }
    context.log('JavaScript timer trigger function ran!', timeStamp);   
    
    context.done();
};