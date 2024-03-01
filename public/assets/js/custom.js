// front end validation in sign in page
function validateForm() {
  var nameInput = document.getElementById('register-username');
  var emailInput = document.getElementById('register-email');
  var mobileInput = document.getElementById('register-mobile');
  var passwordInput = document.getElementById('register-password');
  var ConPasswordInput = document.getElementById('register-con-password');

  var nameRegex = /^[A-Za-z]+(\s[A-Za-z]+)*$/;
  if (!nameRegex.test(nameInput.value)) {
      showErrorAlert('Please enter a valid name with only letters and at least one non-space character.');
      nameInput.focus();
      return false;
  }

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value)) {
      showErrorAlert('Please enter a valid email address.');
      emailInput.focus();
      return false;
  }

  var phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(mobileInput.value)) {
      showErrorAlert('Please enter a valid 10-digit phone number.');
      mobileInput.focus();
      return false;
  }

  var passwordRegex = /^(?=.*\d)(?=.*[A-Z]).{6,}$/;
  if (!passwordRegex.test(passwordInput.value)) {
      showErrorAlert('Password must be at least six characters and include at least one number and one uppercase letter.');
      passwordInput.focus();
      return false;
  }

  if (passwordInput.value !== ConPasswordInput.value) {
      showErrorAlert('Passwords do not match.');
      ConPasswordInput.focus();
      return false;
  }

  return true;
}

function showErrorAlert(message) {
  Swal.fire({
      icon: 'error',
      title: 'Validation Error',
      text: message,
  });
}




// add to wishlisht code 
function addToWishlist(id){
   
    const data = {productId:id}
    console.log(data);
  $.ajax({
    url:'/addToWishlist',
    method:'POST',
    data:data,
    success:function (response){
      if(response.added == true){
        Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Added to Whishlist ',
            confirmButtonColor: "#3085d6",
            confirmButtonText: 'ok',
          })
      }else if (response.login == true){
        Swal.fire({
            icon: 'warning',
            title: 'Please Login',
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Login",
            showCancelButton: true,
            cancelButtonColor: "#d33",
            text: response.message
          }).then((res) => {
            if (res.isConfirmed) {
              window.location.href = '/login'
            }
          })
      }else if(response.already == true){
        Swal.fire({
          title:'already in the whishlist',
          confirmButton:false
        })
      }
    }
  })
  }
  // add to cart js
  
  $(document).ready(function () {
    $("#addToCartBtn").on("click", function (event) {
        event.preventDefault();
        
        const productId = getParameterByName("id");

        $.ajax({
url: '/addToCart',
method: 'POST',
data: { productId: productId, productQuantity: 1 },
success: function (response) {
    console.log('Response:', response);

    if (response.login) {
        // Use SweetAlert for login message
        console.log('Login Required:', response.message);
        Swal.fire({
            icon: 'warning',
            title: 'Please Login',
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Login",
            showCancelButton: true,
            cancelButtonColor: "#d33",
            text: response.message
        });
    } else if (response.success) {
        // Use SweetAlert for success message
        console.log('Success!');
        Swal.fire({  
            title: 'Success',
            text: 'Item added to the cart successfully!',
            icon: 'success', 
        });
    }
},
error: function (error) {
    // Use SweetAlert for error message
    console.log('Error:', error.responseText || 'An error occurred!');
    Swal.fire({
        title: 'Error',
        text: error.responseText || 'An error occurred!',
        icon: 'error',
    });
}
});  


    });

    
    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
});