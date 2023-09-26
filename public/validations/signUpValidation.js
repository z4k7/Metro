const fnameError = document.getElementById("fnameErr")
const lnameError = document.getElementById("lnameErr")
const mobileError = document.getElementById("mobileErr")
const emailError = document.getElementById("emailErr")
const passwordError = document.getElementById("passwordErr")
const cPasswordError = document.getElementById("confirmPasswordErr")



const nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z])$/
const emailRegex = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
const mobileRegex = /^[6-9]\d{9}$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

//fname
function validateFName() {
    let name = document.getElementById("fname").value.trim()
    console.log('validating fname');
    if (name.length === 0) {
        fnameError.innerHTML = "Name required!";
        return false;
    }
    if (!name.match(nameRegex)) {
        fnameError.innerHTML = "No numbers allowed";
        return false;
    }
    fnameError.innerHTML = "";
    return true;
}

//lname
function validateLName() {
    let name = document.getElementById("lname").value.trim()
    if (name.length === 0) {
        lnameError.innerHTML = "Name required!";
        return false;
    }
    if (!name.match(nameRegex)) {
        lnameError.innerHTML = "No numbers allowed";
        return false;
    }
    lnameError.innerHTML = "";
    return true;
}

// email
function validateEmail() {
    let email = document.getElementById("email").value.trim()
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

// mobile

function validateMobile() {
    let mobile = document.getElementById('mobile').value.trim()

    if (mobile.length === 0) {
        mobileError.innerHTML = "Mobile required!";
        return false;
    }
    if (!mobile.match(mobileRegex)) {
        mobileError.innerHTML = 'Enter a valid mobile no.'
        return false
    }
    mobileError.innerHTML = ""
    return true
}

// password

function validatePassword() {
    let password = document.getElementById("password").value.trim()
    if (password.length === 0) {
        passwordError.innerHTML = "Password required!";
        return false;
    }else if(password.length < 8){
        passwordError.innerHTML = 'Password must contain 8 characters'
        return false
    }

    if (!password.match(passwordRegex)) {
        passwordError.innerHTML = "Password must contain a Upper case, Lower case and Number"
        return false
    }
    passwordError.innerHTML = ''
    return true
}

// cpassword

function validateConfirmPassword() {
    let password = document.getElementById("password").value.trim()
    let cPassword = document.getElementById("confirmPassword").value.trim()
    if (cPassword.length === 0) {
        cPasswordError.innerHTML = "Confirm Password required!";
        return false;
    }
    if (password !== cPassword) {

        cPasswordError.innerHTML = `Passwords doesn't match`
        return false
    }
    cPasswordError.innerHTML = ""
    return true
}

// signup
function validateSignUp() {
    return validateFName() && validateLName() && validateEmail() && validateMobile() && validatePassword() && validateConfirmPassword()
}

// login
function validateLogin(){
    return validateEmail() && validatePassword()
}

function validateProfile(){
    return validateFName() && validateLName() && validateMobile() && validateDOB()
}

