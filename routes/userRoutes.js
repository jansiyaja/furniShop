const express = require('express');
const user_route = express();
const userController = require('../controllers/userController');
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
user_route.get('/register', userController.loadSignup);


user_route.get('/product',userController.loadShop)



user_route.post('/register',userController.insertUser)

module.exports = user_route;
