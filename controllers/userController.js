const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const userOtpVerification = require('../models/userOtpVerification');
const Order= require('../models/orderModel')
const Cart=require('../models/cartModel')


//------Home page----------------------------//
const loadHome = async (req, res) => {
  try {
   
      res.render('home', { user: req.session.user});

  } catch (error) {
    console.error('Error in loadHome:', error);
    res.status(500).send('Internal Server Error');
  }
};

//----------------------------------------------//

// ----------Load login page-------------------//
const loadLogin = async (req, res) => {
  
  try {
    res.render('login');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};
//-----------------------------------------------//


// userLogout session---------------------------//
const logout = async (req, res, next) => {

  try {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }
        else {
          return res.redirect('/login')
        }
      })
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');

  }


};
//--------------------------------------------------------------------------------//

// ----------Secure the password------------------------------------------//
const securePassword = async (password) => {
  try {
    const securePass = await bcrypt.hash(password, 10);
    return securePass;
  } catch (error) {
    console.log('Error in securePassword:', error.message);
    throw new Error('Failed to secure password. ' + error.message);
  }
};
//-------------------------------------------------------------//

// ---------------------Load signup page------------------------------------//
const loadSignup = (req, res) => {
  try {
    res.render('register');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

//------------------------------------------------------------------------------------//

//-------------check the user------------------------------//

const insertUser = async (req, res) => {
  try {

    const securepassword = await securePassword(req.body.password);
    console.log('Request Body:', req.body);
    console.log('Secure Password:', securepassword);

    // Check if the email is already in use
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.render("login", { message: "Email is already in use" });
    } else {
      const user = new User({

        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: securepassword,
        is_admin: 0,
        verified: 0,
        Blocked: false
      });
      sendOtpVerificationMail(user, res);
      await user.save();
    }




  }
  catch (error) {
    console.log(error.message)
  }
};

//---------------------------------------------------------------------------------//

//-------node mailer setup-------------------------------------//
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_EMAIL,
    pass: process.env.MAIL_PASSWORD
  }
});


const sendOtpVerificationMail = async ({ email }, res) => {
  try {

    const otp = generateOtp();
    console.log(otp);

    const emailOptions = {
      from: "jansiyajahan8@gmail.com",
      to: email,
      subject: 'Verify your email',
      html: `Lets complete your account setting with furnishop. Your OTP is ${otp}`,
    };

    const hashedOtp = await bcrypt.hash(otp, 10);

    const newOtpVerification = new userOtpVerification({
      email,
      otp: hashedOtp,
      createdAt: new Date(),
    });

    await newOtpVerification.save();

    await transporter.sendMail(emailOptions);
    res.redirect(`/otp?email=${email}`);


  } catch (error) {
    handleError(res, error, 'Failed to send OTP email');
  }
};

//--------------------------------------------------------------------------------//

//---------------resend OTP-----------------------------------//
const resendOtp = async (req, res) => {
  try {
    console.log(process.env.MAIL_EMAIL);
    console.log(process.env.MAIL_PASSWORD);
    const { email } = req.body;
    const otp = generateOtp();
    console.log(otp);

    const emailOptions = {
      from: "jansiyajahan8@gmail.com",
      to: email,
      subject: 'Verify your email',
      html: `Your resend OTP is ${otp}`,
    };

    const hashedOtp = await bcrypt.hash(otp, 10);

    const newOtpVerification = new userOtpVerification({
      email,
      otp: hashedOtp,
      createdAt: new Date(),
    });

    await newOtpVerification.save();

    await transporter.sendMail(emailOptions);

    const resendUrl = `${req.protocol}://${req.get('host')}/otp?email=${email}`;
    res.json({ resendUrl });
  } catch (error) {
    handleError(res, error, 'Failed to send OTP emaill');
  }
};

const generateOtp = () => `${Math.floor(100000 + Math.random() * 9000)}`;


const handleError = (res, error, message) => {
  console.error(`Error: ${message}`, error.message);
  res.status(500).send(message);
};
//-------------------------------------------------------------------------------//


// ----------------Load OTP page-----------------------------------------------//
const loadOtp = async (req, res) => {
  try {
    const email = req.query.email;
    res.render('otp', { email: email });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};
//-----------------------------------------------------------------------//

//--------------- Verify OTP-----------------------------//
const verifyOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const otp =
      req.body.digit1 +
      req.body.digit2 +
      req.body.digit3 +
      req.body.digit4 +
      req.body.digit5 +
      req.body.digit6;

    const userVerification = await userOtpVerification.findOne({ email: email, });

    const { otp: hashedOtp } = userVerification;
    const validOtp = await bcrypt.compare(otp, hashedOtp);

    if (validOtp) {
      const userData = await User.findOne({ email: email });
      if (userData) {
        await User.findByIdAndUpdate(
          {
            _id: userData._id,
          },
          {
            $set: {
              verified: true,
            },
          }
        );

      }
    } else {

      res;
    }


    const user = await User.findOne({ email: email })
    await userOtpVerification.deleteOne({ email: email })
    if (user.verified) {
      if (!user.Blocked) {
        req.session.user = {
          _id: user._id,
          name: user.name,
          email: user.email
        }
        res.redirect('/login')
      } else {
        console.log("user blocked from this site");



        res.redirect(`/otp?email=${email}`, )

      }
    } 
      else {
        req.flash('error', 'OTP is incorrect or expired');
        res.redirect(`/otp?email=${email}`);
      

    }
  }
  catch (error) {
    console.log(error);
  }
}
//-------------------------------------------------------------------//


//---------------UserLogin----------------------------//
const UserLogin = async (req, res) => {
  try {
    const email = req.body.email; 
    const user = await User.findOne({ email: email });

    if (user) {
      if (user.verified) {
        if (user.Blocked) {
          res.render('login', { message: "User is blocked by the admin" });
        } else {
          const password = req.body.password;
          const dbpass = user.password;
       
          const pass = await bcrypt.compare(password, dbpass);
          
          if (pass) {
            req.session.user = {
              email: user.email,
              id: user._id,
              name: user.name,
            };
            res.redirect('/');
          } else {
            res.render('login', { message: "Incorrect Password" });
            console.log('Incorrect password');
          }
        }
      } else {
        console.log('User is not verified');
        res.render('login', { message: "User is not verified" });
      }
    } else {
      res.render('login', {message: "User is not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

//------------------------------------------------------//
//---------- load about page--------------------------------------------//


const loadAbout= async (req,res)=>{
  try {
    res.render('about')
  } catch (error) {
    console.log(error);
  }
}
//--------------Load userDashboard----------------------------------------//
const loadDashboard = async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.user.id;
      console.log("userId", userId);

      const orders = await Order.find({ userId: userId });
      console.log(orders);

      const user = await User.findOne({ _id: userId });

      res.render('userProfile', { userDetails: user, orders: orders });
    } else {
      req.flash('error', 'Please log in.');
      res.redirect('/login');
      console.log("Please verify");
    }

  } catch (error) {
    console.log(error);
  }
}

//------------------------------------------------------//
//-----------------Edit  User Profile-------------------------------------//
const editProfile = async (req, res) => {
  try {
    console.log("you are in the deit");
    const id = req.session.user.id; 
    console.log("edotId",id);
    const newName = req.body.editName;
    const newEmail = req.body.editEmail;
    const newMobile = req.body.editPhone;

    console.log("id", id);
    console.log("newName", newName);

    const already = await User.findOne({ _id: id, name: newName });

    if (already) {
      req.flash('error', 'This name is already taken');
      res.redirect('/user');
    } else {
      await User.findByIdAndUpdate(id, { $set: { name: newName, email: newEmail, mobile: newMobile } });
      req.flash('success', 'Profile updated successfully');
      res.redirect('/user');
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

//------------------------------------------------------//
//------------------Add Addresses------------------------------------//
const addAddress = async (req, res) => {
  try {
    console.log(req.body);
    const { fullName, city, streetAddress, state, zipCode, phone } = req.body;

   
    const user = await User.findOne({ _id: req.session.user.id });
    const existAddress = user.address.find((addr) => addr.streetAddress === streetAddress);

    if (existAddress) {
      req.flash('success', 'Address already exists');
      res.redirect('/user');
    } else {
      
      user.address.push({
        fullName: fullName,
        streetAddress: streetAddress,
        phone: phone,
        city: city,
        pincode: zipCode,
        state: state,
      });

      
      await user.save();

      req.flash('success', 'Address added successfully');
      res.redirect('/user');
    }
  } catch (error) {
    console.error(error.message);
   
  }
};


//------------------------------------------------------//
//------------Edit Address---------------------------------------------//
 const editAddress= async(req,res)=>{
  try {
    const userId = req.params.userId;
    const addressIndex = req.params.addressIndex;

    
    const user = await User.findById(userId);

    if (!user || !user.address || user.address.length <= addressIndex) {
      req.flash('error', 'Address not found');
      return res.redirect('/user');
    }

    const addressDetails = user.address[addressIndex];

    // Render a form with address details for editing
    res.render('editAddress', { addressDetails });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
 }


//------------------------------------------------------//
//------------Delete Addressess------------------------------------------//
const deleteAddress= async (req,res)=>{
  try {
    const userId = req.params.userId;
    const addressIndex = req.params.addressIndex;

    
    const user = await User.findById(userId);

    if (!user || !user.address || user.address.length <= addressIndex) {
      req.flash('error', 'Address not found');
      return res.redirect('/user');
    }

    user.address.splice(addressIndex, 1);

    await user.save();

    req.flash('success', 'Address deleted successfully');
    res.redirect('/user');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }

}
//-----------------------------------------------------//
//-------- Load checkOut---------------------------------------------//
const loadCheckout = async (req, res) => {
  try {
      const userid = req.session.user.id;
      const user = await User.findOne({ _id: userid });

      const cart = await Cart.findOne({ userId: userid }).populate('products.productId');

      
      cart.products.forEach((product) => {
          product.totalPrice = product.quantity * product.productId.productPrice;
      });

     
      const subtotal = cart.products.reduce((acc, product) => acc + product.totalPrice, 0);

      res.render('checkout', { user: user, cart: cart.products, subtotal: subtotal });
  } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
  }
};

//-----------------------------------------------------//


// Export module
module.exports = {
  loadHome,
  loadLogin,
  logout,
  securePassword,
  loadSignup,
  insertUser,
  sendOtpVerificationMail,
  loadOtp,
  verifyOtp,
  resendOtp,
  UserLogin,
  loadAbout,
  loadDashboard,
  editProfile,
  addAddress,
  deleteAddress,
  editAddress,
  loadCheckout
};
