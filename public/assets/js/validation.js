
function validateForm() {
  
    var nameInput = document.getElementById('register-username');
    var emailInput = document.getElementById('register-email');
    var mobileInput = document.getElementById('register-mobile');
    var passwordInput = document.getElementById('register-password');


    var nameRegex = /^[A-Za-z]+(\s[A-Za-z]+)*$/;
    if (!nameRegex.test(nameInput.value)) {
        alert('Please enter a valid name with only letters and at least one non-space character.');
        nameInput.focus();
        return false;
    }

   
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
        alert('Please enter a valid email address.');
        emailInput.focus();
        return false;
    }

   
    var phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(mobileInput.value)) {
        alert('Please enter a valid 10-digit phone number.');
        mobileInput.focus();
        return false;
    }

   
    var passwordRegex = /^(?=.*\d)(?=.*[A-Z]).{6,}$/;
    if (!passwordRegex.test(passwordInput.value)) {
        alert('Password must be at least six characters and include at least one number and one uppercase letter.');
        passwordInput.focus();
        return false;
    }


    return true;
}
