var http = require('http');
var url = require('url');
var fs = require('fs');
var serverModule = require('./serverModule');

http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    var filename = "." + q.pathname;

    fs.readFile(filename, function(err, data) {
        if (err) {
          res.writeHead(404, {'Content-Type': 'text/html'});
          return res.end("404 Not Found");
        } 
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });

    // Login page accessed
    if(q.pathname == "/loginpage.html")    // Login page
    {    
        // Todo: Only retrieve the login data when attempting to login or sign up
        var userPasses = serverModule.retrieveLogins(res);        

    }


    

    //res.writeHead(200, {'Content-Type': 'text/html'});
    //res.write("Hello Server!");




    //return res.end();
}).listen(8080); 
