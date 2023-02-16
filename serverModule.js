var fs = require('fs');

exports.retrieveLogins = function (res) {
    var filename = "UsernamesPasswords.txt";    
    // All of the code in this retrieveLogins can go inside of readfile but it should return the dictionary
    var loginData = fs.readFileSync(filename, 'utf-8', function(err, data) {
        if (err) {
          console.log("Error: data not found");
          res.end("404 Not Found");
          return {};
        }         
        return data;
    });

    console.log(loginData);
    loginData = loginData.split('\r\n');
    console.log("\nSize: " + loginData.length + '\n' + loginData);

    loginDictionary = {};
    for (let index = 0; index < loginData.length; index ++) {
      loginDictionary[loginData[index].split(' ')[0]] = loginData[index].split(' ')[1];          
    }        
    console.log("loginDictionary test u1->p1: " + loginDictionary.u1);
    
    return loginDictionary;
  }; 
