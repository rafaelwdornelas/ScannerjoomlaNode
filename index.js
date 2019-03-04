const api = require('./scanner')
const LineByLineReader = require('line-by-line')
//https://packetstormsecurity.com/search/files/page14/?q=joomla


lr = new LineByLineReader('lista.txt');
lr.on('error', function (err) {
    console.log(err)
});
 var travado =  true;
lr.on('line', function (line) {
    lr.pause();
    api.verfica('http://'+line.toLowerCase()).then(function(retorno) {
        console.log(retorno)
        
     })
     setTimeout(function () {
        // ...and continue emitting lines.
        lr.resume();
    }, 1000);
     
     
});


lr.on('end', function () {
    console.log("Acabou lista")
}); 