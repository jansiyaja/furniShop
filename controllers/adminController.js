const User=require("../models/userModel");
const bcrypt=require("bcrypt");



const adminLogin=async(req,res)=>{
    try {
        res.render('login')
      } catch (error) {
        console.log(error.message);
      }
    }

    const admindash=async(req,res)=>{
      try {
          res.render('dashboard')
        } catch (error) {
          console.log(error.message);
        }
      }


    const verifyLogin= async (req,res)=>{
      try {
        let email = 'admin@gmail.com';
        let password = 'admin';
        if (req.body.password === password && req.body.email === email) {
         res.render('dashboard')
        }
      } catch (error) {
        console.log(error);
      }
    }

    module.exports = {
        adminLogin,
        admindash,
        verifyLogin,
      };