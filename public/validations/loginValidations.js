const emailError = document.getElementById("emailErr");
const passwordError = document.getElementById("passwordErr");

const emailRegex = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;


function validateEmail() {
    let email = document.getElementById("email").value.trim();
    if (email.length === 0) {
      emailError.innerHTML = "Email required!";
      return false;
    }
    if (!email.match(emailRegex)) {
      emailError.innerHTML = "Enter a valid email";
  
      return false;
    }
    emailError.innerHTML = "";
    return true;
  }

  function validatePassword() {
    let password = document.getElementById("password").value.trim();
    if (password.length === 0) {
      passwordError.innerHTML = "Password required!";
      return false;
    } else if (password.length < 8) {
      passwordError.innerHTML = "Password must contain 8 characters";
      return false;
    }
  
    if (!password.match(passwordRegex)) {
      passwordError.innerHTML =
        "Password must contain a Upper case, Lower case and Number";
      return false;
    }
    passwordError.innerHTML = "";
    return true;
  }


  function validateLogin() {
    
    return validateEmail() && validatePassword();
  }