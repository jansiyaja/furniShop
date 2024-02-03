const express = require('express');
const user_route = express();
const userController = require('../controllers/userController');
const productController=require('../controllers/productController')
const session = require('express-session');

const config = require('../config/config');
user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));
user_route.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

const auth = require('../middleware/auth')

user_route.get('/', userController.loadHome);



user_route.get('/login',userController.loadLogin);
user_route.post('/login', userController.UserLogin);
user_route.get('/logout',userController.logout);
user_route.get('/otp', userController.loadOtp);
user_route.post('/otp', userController.verifyOtp);
user_route.post('/resendOtp', userController.resendOtp);
user_route.get('/register', userController.loadSignup);

user_route.get('/about',userController.loadAbout);



user_route.post('/register',userController.insertUser)

user_route.get('/shop',productController.loadShop)

user_route.get('/productView',productController.productView)

module.exports = user_route;
