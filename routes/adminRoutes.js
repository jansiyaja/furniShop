// Importing required modules
const express = require("express")
const admin_route = express()
const adminController = require('../controllers/adminController')

const session = require('express-session');
admin_route.set('view engine','ejs')
admin_route.set('views','./views/Admin')
const config = require('../config/config');

admin_route.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);



admin_route.use(express.json())
admin_route.use( express.urlencoded({extended : true}))



admin_route.get('/login',adminController.adminLogin)
admin_route.get('/dashboard',adminController.admindash)












// Export the router module for use in the main application
module.exports = admin_route;
