const express = require('express');
const user_route = express();
const userController = require('../controllers/userController');
const productController=require('../controllers/productController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')

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

const auth=require('../middleware/auth')

 
//------------------Register and Login session-----------------------------------//
user_route.get('/',userController.loadHome);
user_route.get('/login', userController.loadLogin);
user_route.post('/login', userController.UserLogin);
user_route.get('/logout', userController.logout);
user_route.get('/otp', userController.loadOtp);
user_route.post('/otp', userController.verifyOtp);
user_route.post('/resendOtp', userController.resendOtp);
user_route.get('/register', userController.loadSignup);
user_route.post('/register',userController.insertUser)
//------------------------------------------------------------------------------------//
//-----------------Rendering the pages---------------------------------------------------------------//
user_route.get('/shop',productController.loadShop)
user_route.get('/productView',productController.productView)
user_route.get('/about',userController.loadAbout);


user_route.get('/user',userController.loadDashboard);
user_route.post('/user',userController.editProfile);

user_route.post('/addAddress',userController.addAddress);
user_route.get('/delete-address/:userId/:addressIndex',userController.deleteAddress);

//----------------------------------------------------------------------------------//

//-----------------------cart management-----------------------------------------------------------//
 
user_route.post('/addToCart',cartController.addToCart)
user_route.post('/removeCart',cartController.removeCart)
user_route.get('/cart',cartController.loadCart)
user_route.post('/updateQuantity',cartController.updateQuantity)
//----------------------------------------------------------------------------------//
user_route.get('/checkout',userController.loadCheckout);
user_route.post('/placeOrder',orderController.placeOrder)

user_route.get('/orderSuccess/:id',orderController.loadOrderSuccess)
user_route.get('/orderDetailes/:id',orderController.loadOrderDetilas)

module.exports = user_route;
