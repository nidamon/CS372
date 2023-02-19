var http = require('http');
var url = require('url');
var fs = require('fs');
const querystring = require('querystring');


http.createServer(function (req, res) {
  if (req.method === 'GET' && req.url === '/') {
    // Read the contents of the HTML file and send it back to the client
    fs.readFile('loginpage.html', function(err, data) {
      if (err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('Error reading file');
      } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
      }
    });
  } else if (req.method === 'POST' && req.url === '/submit') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const formData = querystring.parse(body);
      const uname = formData.textUname || '';
      const pass = formData.textpass || '';
      console.log(uname)
      console.log(pass)
      const html = `<!DOCTYPE html>
        <html>
          <head>
            <title>Node.js Server Response</title>
          </head>
          <body>
            <p>You entered for username: ${uname}</p>
            <p>You entered for password: ${pass}</p>
          </body>
        </html>`;
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    });
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not found');
  }
	
  //res.end();
}).listen(8080); 