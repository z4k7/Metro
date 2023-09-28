const fnameError = document.getElementById("fnameErr");
const lnameError = document.getElementById("lnameErr");
const mobileError = document.getElementById("mobileErr");

const nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z])$/;
const mobileRegex = /^[6-9]\d{9}$/;

function validateFName() {
    let name = document.getElementById("fname").value.trim();
  
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
    let name = document.getElementById("lname").value.trim();
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

  function validateMobile() {
    let mobile = document.getElementById("mobile").value.trim();
  
    if (mobile.length === 0) {
      mobileError.innerHTML = "Mobile required!";
      return false;
    }
    if (!mobile.match(mobileRegex)) {
      mobileError.innerHTML = "Enter a valid mobile no.";
      return false;
    }
    mobileError.innerHTML = "";
    return true;
  }

  






function validateProfile() {
    return (
      validateFName() && validateLName() && validateMobile() && validateDOB()
    );
  }