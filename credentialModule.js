var dataBaseModule = require('./databaseModule.js')

// ######################################################################################
// Validate User Credentials
// Note: Code needs to be simplified
// ######################################################################################

// Validates User credentials
// Takes in a two stings username, password
// and a dictionary of the logins (dict)
exports.validateUser = async function(username, password, callback_argBool_argStringMessage)
{
  if(await invalidUsername(username, callback_argBool_argStringMessage))
    return;

  if(await accountLocked(username, callback_argBool_argStringMessage))
    return;

  if(await passwordCorrect(username, password, callback_argBool_argStringMessage))
    return;

  // Login success
  callback_argBool_argStringMessage(true, "Success.");
}

// Promise wrapper for isValidUsername
function invalidUsername(username, callback_argBool_argStringMessage){
  return new Promise(resolve => {
    exports.isValidUsername(username, function(isValid) {
      if (!isValid)
        callback_argBool_argStringMessage(false, "Invalid Username.");
      resolve(!isValid);
    });
  });
}
// Promise wrapper for isAccountLocked
function accountLocked(username, callback_argBool_argStringMessage){
  return new Promise(resolve => {
    exports.isAccountLocked(username, function(isLocked) {
      if (isLocked)
        callback_argBool_argStringMessage(false, "Your account is currently locked.");
      resolve(isLocked);
    });
  });
}
// Promise wrapper for isPasswordCorrect
function passwordCorrect(username, password, callback_argBool_argStringMessage){
  return new Promise(resolve => {
    exports.isPasswordCorrect(username, password, function(isCorrect) {
      if (!isCorrect)
        failedlogin(username, function(message) {
          callback_argBool_argStringMessage(false, "The username or password is incorrect. " + message);
        });
      resolve(!isCorrect);
    });
  });
}

// Checks if username is present in the database
exports.isValidUsername = async function(uName, callback_argBool)
{  
  dataBaseModule.doesUserExist(uName, callback_argBool);
}  

// Checks if password is correct for the given username
exports.isPasswordCorrect = async function(uName, pass, callback_argBool)
{
  // Does given password match stored password
  dataBaseModule.getUserFieldData(uName, "password", function(AccountPassword){
    isCorrect = AccountPassword == pass;    
    if(isCorrect)
      exports.loginUser(uName);

    callback_argBool(isCorrect);
  })
}

// Changes the password of username
exports.changePassword = async function(username, newPassword)
{
  // Change password
  dataBaseModule.editUserFieldData(username, "password", newPassword, function(){
    // Unlock account
    dataBaseModule.editUserFieldData(username, "locked", "notLocked", function(){
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
  dataBaseModule.editUserFieldData(username, "loggedIn", "loggedIn");
  console.log("User \"" + username + "\" has logged in.");
}
// Checks if the account tied to the username is currently logged in
exports.isLoggedin = function(username, callback_argBool)
{
  console.log("Is user: " + username + " logged in?");
  dataBaseModule.getUserFieldData(username, "loggedIn", function(loggedInValue){
    callback_argBool(loggedInValue == "loggedIn"); // Passes true if user is logged in
  });
}
// Logout handling
exports.logoutUser = function(username)
{
  dataBaseModule.editUserFieldData(username, "loggedIn", "notLoggedIn");
  console.log("User \"" + username + "\" has logged out.");
}


// Handles the failed login attempts
async function failedlogin(username, callback_argStringMessage)
{    
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
      callback_argFailedLogins(failedLogins);
    });      
  });
}
// Second failed login
function hasFailed2ndLogin(failedlogins)
{
  // All time is in milliseconds (conv: minutes * seconds * milliseconds)
  var hour = 60*60*1000;
  return failedlogins.newest - failedlogins.secondOldest < hour;     
}
// Returns true if there have been 3 failed login attempts within an hour
function threeFailedInAnHour(failedlogins)
{
  // All time is in milliseconds (conv: minutes * seconds * milliseconds)
  var hour = 60*60*1000;
  return failedlogins.newest - failedlogins.oldest < hour;
}

exports.isAccountLocked = async function(username, callback_argBool)
{
  dataBaseModule.getUserFieldData(username, "locked", function(isLocked)
  {    
    if(isLocked == "notLocked")
      callback_argBool(false); // Say it's not locked
    else
      dataBaseModule.getUserFieldData(username, "failedLogins", function(failedLogins)
      {
        // All time is in milliseconds (conv: hours * minutes * seconds * milliseconds)
        var day = 24*60*60*1000;

        // 24 hour unlock check
        if(Date.now() - failedLogins.newest > day)
        {
          // 24 hours has passed -> unlock the account
          dataBaseModule.editUserFieldData(username, "locked", "notLocked", function(){
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
  dataBaseModule.editUserFieldData(username, "locked", "locked");
}
