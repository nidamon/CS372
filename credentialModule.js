var dataBaseModule = require('./databaseModule.js')

// ######################################################################################
// Validate User Credentials
// Note: Code needs to be simplified
// ######################################################################################

// Validates User credentials
// Takes in a two stings (uname = username and pass = password)
// and a dictionary of the logins (dict)
exports.validateUser = function(uname, pass, callback_argBool_argStringMessage)
{
  exports.isValidUsername(uname, function(isValid){
    // Username valid
    if(isValid) {
      exports.isAccountLocked(uname, function(isLocked){
        if(isLocked == false) {
          exports.isPasswordCorrect(uname, pass, function(isCorrect){
            // Password correct
            if(isCorrect){
              callback_argBool_argStringMessage(true, "Success");
            } else {          
              failedlogin(uname, function(message) {
                callback_argBool_argStringMessage(false, 'The username or password is incorrect. ' + message);
              });
            }
          }); // [End] - isPasswordCorrect callback          
        } else { // Account is currently locked        
          callback_argBool_argStringMessage(false, "Your account is currently locked");
        }
      }); // [End] - isAccountLocked callback      
    } else {
      // Username not valid
      callback_argBool_argStringMessage(false, "Invalid Username");
    }
  }); // [End] - isValidUsername callback  
}

// Checks if username is present in the database
exports.isValidUsername = async function(uname, callback_argBool)
{  
  dataBaseModule.doesUserExist(uname, callback_argBool);
}  

// Checks if password is correct for the given username
exports.isPasswordCorrect = function(uname, pass, callback_argBool)
{
  // Does given password match stored password
  dataBaseModule.getUserFieldData(uname, "password", function(AccountPassword){
    isCorrect = AccountPassword == pass;    
    if(isCorrect)
      exports.loginUser(uname);

    callback_argBool(isCorrect);
  })
}

// Changes the password of username
exports.changePassword = async function(username, newPassword)
{
  // Change password
  dataBaseModule.editUserFieldData(username, "password", newPassword, function(){
    // Unlock account
    dataBaseModule.editUserFieldData(username, "locked", "no", function(){
      // Reset failed logins
      dataBaseModule.editUserFieldData(username, "failedLogins", {
        "oldest": 0,
        "secondOldest": 0,
        "newest": 0
      }); 
    });
  });
}


// Login handling
exports.loginUser = function(username)
{
  // Todo: Start a session on client side
  dataBaseModule.editUserFieldData(username, "loggedIn", "yes");
  console.log("User \"" + username + "\" has logged in.");
}
// Logout handling
exports.logoutUser = function(username)
{
  // Todo: Session handling
  dataBaseModule.editUserFieldData(username, "loggedIn", "no");
  console.log("User \"" + username + "\" has logged out.");
}


// Handles the failed login attempts
async function failedlogin(username, callback_argStringMessage)
{    
  // Function code
  cycleTimes(username, function(failedlogins){
    // Lock account on third failed attempt
    if(threeFailedInAnHour(failedlogins))
    {
      exports.lockAccount(username);
      callback_argStringMessage("Account has been locked for 24 hours");
    }
    else if (hasFailed2ndLogin(failedlogins))
    {
      callback_argStringMessage("2nd failed login");
    }
    else
    {
      callback_argStringMessage("Wrong password");
    }
  }); // [End] - cycleTimes callback
}
// Adds the most recent login attempt and shifts the rest back discarding the oldest one.
async function cycleTimes(username, callback_argFailedLogins)
{    
  dataBaseModule.getUserFieldData(username, "failedLogins", function(failedLogins){
    failedLogins.oldest = failedLogins.secondOldest;
    failedLogins.secondOldest = failedLogins.newest;
    failedLogins.newest = Date.now();
    console.log(failedLogins);
     // Update user account
    dataBaseModule.editUserFieldData(username, "failedLogins", failedLogins, function(){
      // Send the failed logins out through the callback
      callback_argFailedLogins(failedLogins);
    });      
  });
}
// Second failed login
function hasFailed2ndLogin(failedlogins)
{
  // All time is in milliseconds
  // minutes * seconds * milliseconds
  var hour = 60*60*1000;
  return failedlogins.newest - failedlogins.secondOldest < hour;     
}
// Returns true if there have been 3 failed login attempts within an hour
function threeFailedInAnHour(failedlogins)
{
  // All time is in milliseconds
  // minutes * seconds * milliseconds
  var hour = 60*60*1000;
  return failedlogins.newest - failedlogins.oldest < hour;
}

exports.isAccountLocked = function(username, callback_argBool)
{
  dataBaseModule.getUserFieldData(username, "locked", function(data)
  {    
    if(data == "no") // "no" == Not locked
      callback_argBool(false); // Say it's not locked
    else
      dataBaseModule.getUserFieldData(username, "failedLogins", function(failedLogins)
      {
        // All time is in milliseconds
        // minutes * seconds * milliseconds
        var day = 24*60*60*1000;

        // 24 hour unlock check
        if(Date.now() - failedLogins.newest > day)
        {
          // 24 hours has passed -> unlock the account
          dataBaseModule.editUserFieldData(username, "locked", "no", function(){
            callback_argBool(false); // Account is unlocked    
          });
        }
        else // Account still locked
          callback_argBool(true); // Account is still locked
      }); 
      // [End] - getUserFieldData "locked" callback
  }); 
  // [End] - getUserFieldData "failedLogins" callback
}

exports.lockAccount = function(username)
{
  dataBaseModule.editUserFieldData(username, "locked", "yes");
}
