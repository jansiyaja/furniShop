const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const userOtpVerification = require('../models/userOtpVerification');
const dotenv = require('dotenv').config();
const product=require('../models/products')


//------Home page----------------------------//
const loadHome = async (req, res) => {
  try {

    res.render('home');
  } catch (error) {
    console.log(error.message);
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
      html: `Your OTP is ${otp}`,
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
      html: `Your OTP is ${otp}`,
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
    handleError(res, error, 'Failed to send OTP email11');
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



        res.redirect(`/otp?email=${email}`, { message: " you are blocked from this contact with admin" })

      }
    } else {
      console.log("otp incorrect else worked")

      res.redirect(`/otp?email=${email}`, { message: "otp is expired" })

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
              _id: user._id,
              name: user.name,
            };
            res.render('home');
          } else {
            res.render('login', { logout: "Incorrect Password" });
            console.log('Incorrect password');
          }
        }
      } else {
        console.log('User is not verified');
        res.render('login', { logout: "Incorrect Password" });
      }
    } else {
      res.render('login', {logout: "User is not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

//------------------------------------------------------//


const loadAbout= async (req,res)=>{
  try {
    res.render('about')
  } catch (error) {
    console.log(error);
  }
}



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
  loadAbout
};
