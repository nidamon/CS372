// ######################################################################################
// Validate User Credentials
// Note: Code needs to be simplified
// ######################################################################################

// Validates User credentials
// Takes in a two stings (uname = username and pass = password)
// and a dictionary of the logins (dict)
exports.validateUser = function(uname, pass, dict){
    
    if((isValidUsername(uname) == true) && (isPasswordCorrect(uname, pass) == true))
    {
      return true // Exit function
    }
    else
    {
      return false
    }
    
  // Checks if username is present in dictionary
  function isValidUsername(uname)
  {
    if(dict[uname] == undefined)
    {
      console.log("There is no such username");
      return false;
    }
      return true;
  }
    
  // Checks if password is correct for the given username
  function isPasswordCorrect(uname, pass)
  {
    // Does given password match stored password
    console.log("Actual Password: " + dict[uname]);
    console.log("Given Password:  " + pass);
    if(dict[uname].localeCompare(pass) == 0)
    {
      console.log("User \"" + uname + "\" has logged in.");
      return true;
    }
      return false;
  }
}