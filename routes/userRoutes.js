const express = require('express');
const user_route = express();
const userController = require('../controllers/userController');
const productController=require('../controllers/productController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const couponController=require('../controllers/couponController')
const auth = require('../middleware/auth');



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



 
//------------------Register and Login session-----------------------------------//
user_route.get('/', userController.loadHome);
// user_route.get('/login',auth.isLogin, userController.loadLogin);
user_route.get('/login',auth.isLogout, userController.loadLogin);
// user_route.post('/login',auth.isLogin, userController.UserLogin);
user_route.post('/login', userController.UserLogin);
// user_route.get('/logout', auth.isLogout, userController.logout);
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
user_route.get('/error404',userController.error404)



user_route.get('/user',auth.isLogin,userController.loadDashboard);
user_route.post('/user',userController.editProfile);
user_route.get('/edit-address/:userId/:addressIndex',userController.editAddress);
user_route.post('/edit-address/:userId/:addressIndex',userController. updateAddress);

user_route.post('/addAddress',userController.addAddress);
user_route.get('/delete-address/:userId/:addressIndex',userController.deleteAddress);
user_route.get('/forgot-password',userController.loadForgetPage)
user_route.post('/forgot-password',userController.loadForget)
user_route.get('/reset-password/:token',userController.resetPassword)
user_route.post('/reset-password/:token',userController.updatePass)

//----------------------------------------------------------------------------------//

//-----------------------cart management-----------------------------------------------------------//
 
user_route.post('/addToCart',cartController.addToCart)
user_route.post('/removeCart',cartController.removeCart)
user_route.get('/cart',cartController.loadCart)
user_route.post('/updateQuantity',cartController.updateQuantity)
//----------------------------------------------------------------------------------//
//--------------------WishList Management--------------------------------------------------------------//
user_route.get('/wishlist',cartController.loadWhislist)
user_route.post('/addToWishlist',cartController.addToWishlist)
user_route.post('/removeWishlist',cartController.removeWishlist)
user_route.post('/wishToCart',cartController.wishToCart)

//----------------------------------------------------------------------------------//
user_route.get('/checkout',userController.loadCheckout);
user_route.post('/placeOrder',orderController.placeOrder)
user_route.get('/orderSuccess/:id',orderController.loadOrderSuccess)
user_route.get('/orderDetailes/:id',orderController.loadOrderDetilas)
user_route.post('/orderCancel',orderController.cancelOrder)
user_route.post('/returnOrder',orderController.returnOrder)
user_route.post('/verify-payment',orderController.verifyPayment)


user_route.get('/refundPolicy',orderController.refundPolicy)

user_route.post('/applyCoupon',couponController.couponApply)


module.exports = user_route;
