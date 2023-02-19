var http = require('http');
var url = require('url');
var fs = require('fs');
const querystring = require('querystring');
//const { realpath } = require('fs/promises');


http.createServer(function (req, res) {  
  if (isRequested(req, 'GET', '/')) 
  {
    sendPage(res, getLoginPage());
  } 
  else if (isRequested(req, 'POST', '/submit')) 
  {
    handleLoginSubmission(req, res);
  } 
  else
  {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not found');
  }
}).listen(8080); 




function isRequested(req, getPost, url)
{
    return req.method === getPost && req.url === url;
}

function sendPage(res, filename)
{
    // Read the contents of the HTML file and send it back to the client
    fs.readFile(filename, function(err, data) {
        if (err) {
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end('Error reading file');
        } else {
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(data);
        }
    });
}

function getLoginPage()
{
  return 'loginpage.html';
}

function handleLoginSubmission(req, res)
{
  // Get form data
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  // Parse form data
  req.on('end', () => {
    const formData = querystring.parse(body);
    const uname = formData.textUname || '';
    const pass = formData.textpass || '';
    console.log(uname)
    console.log(pass)

    // Returned response
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
}
