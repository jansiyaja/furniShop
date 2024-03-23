const express = require('express');
const nocache = require("nocache");
const user_route = express();
const userController = require('../controllers/userController');
const productController=require('../controllers/productController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const couponController=require('../controllers/couponController')
const auth = require('../middleware/auth');
user_route.use(nocache());


const session = require('express-session');

const flash = require("express-flash")
user_route.use(flash())

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

user_route.get('/login',auth.login, userController.loadLogin);

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
user_route.get('/error404',userController.error404)



user_route.get('/user',auth.isLogin,userController.loadDashboard);
user_route.get('/user-edit',auth.isLogin,userController.loadeditProfile);
user_route.post('/user-edit',auth.isLogin,userController.editProfile);
user_route.get('/edit-address/:addressId/:index',auth.isLogin, userController.loadeditAddress);
user_route.post('/edit-address',auth.isLogin, userController.editAddress);
user_route.post('/changePassword', auth.isLogin, userController.changePassword)
user_route.post('/addAddress', auth.isLogin,userController.addAddress);
user_route.get('/delete-address/:userId/:addressIndex', auth.isLogin,userController.deleteAddress);
user_route.get('/forgot-password',userController.loadForgetPage)
user_route.post('/forgot-password',userController.loadForget)
user_route.get('/reset-password/:token',userController.resetPassword)
user_route.post('/reset-password/:token',userController.updatePass)

//----------------------------------------------------------------------------------//

//-----------------------cart management-----------------------------------------------------------//
 
user_route.post('/addToCart',auth.isLogin, cartController.addToCart)
user_route.post('/removeCart',auth.isLogin,cartController.removeCart)
user_route.get('/cart',cartController.loadCart)
user_route.post('/updateQuantity',auth.isLogin,cartController.updateQuantity)
//----------------------------------------------------------------------------------//
//--------------------WishList Management--------------------------------------------------------------//
user_route.get('/wishlist', auth.isLogin,cartController.loadWhislist)
user_route.post('/addToWishlist', auth.isLogin,cartController.addToWishlist)
user_route.post('/removeWishlist', auth.isLogin,cartController.removeWishlist)
user_route.post('/wishToCart', auth.isLogin,cartController.wishToCart)

//----------------------------------------------------------------------------------//
user_route.get('/checkout',  auth.isLogin,userController.loadCheckout);
user_route.post('/placeOrder', auth.isLogin,orderController.placeOrder)
user_route.get('/orderSuccess/:id',auth.isLogin, orderController.loadOrderSuccess)
user_route.get('/orderDetailes/:id',auth.isLogin,orderController.loadOrderDetilas)
user_route.post('/orderCancel', auth.isLogin,orderController.cancelOrder)
user_route.post('/returnOrder', auth.isLogin,orderController.returnOrder)
user_route.post('/verify-payment', auth.isLogin,orderController.verifyPayment)
user_route.post('/countinuePayment', auth.isLogin,orderController.PaymentCountinue)
user_route.post('/countinueVerify-payment', auth.isLogin,orderController.CountinuePayment)


user_route.get('/refundPolicy', auth.isLogin,orderController.refundPolicy)

user_route.post('/applyCoupon',couponController.couponApply)
user_route.get('/invoice/:id',auth.isLogin,orderController.loadInvoice)


module.exports = user_route;
