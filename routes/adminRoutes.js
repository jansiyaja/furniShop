
const express = require("express")
const admin_route = express()
const multer = require('../middleware/multer')
const adminAuth = require('../middleware/adminAuth')

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

//----controllers-------------//

const adminController = require('../controllers/adminController')
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const couponController = require('../controllers/couponController')

//-----------------------------------------------------------//



admin_route.get(['/login', '/'],adminController.adminLogin)

admin_route.post(['/login', '/'], adminController.adminLogin);

admin_route.get('/logout',adminController.adminLogout)

admin_route.get('/dashboard',adminController.loadHome)
admin_route.get('/customers',adminController.userManagementSystem)
admin_route.post('/blockUser',adminController.blockUser)

//---------------------- product session-----------------------------------------//

admin_route.get('/Products',adminAuth.isLogout,productController.loadProduct)
admin_route.get('/addProduct',productController.loadaddProduct)
admin_route.post('/addProduct',multer.array('images'),productController.addProduct)
admin_route.get('/editProduct',productController.editProductLoad)
admin_route.post('/editProduct',multer.array('images'),productController.editProduct)

admin_route.post('/listproduct',productController.listUnlist)

//-------------------------------------------------------------------//


//---------------------- cateory session-----------------------------------------//
admin_route.get('/category',categoryController.loadCategory)
admin_route.get('/addCategory',  categoryController.loadaddCategory)
admin_route.post('/addCategory', categoryController.insertCategory)
admin_route.post('/listCategory',categoryController.listCategory)
admin_route.get('/editCategory',categoryController.LoadEditCategory)
admin_route.post('/editCategory',categoryController.editCategory)

//------------------------------------------------------------------//
//-------------------Orders Management-----------------------------------------------//
admin_route.get('/orders',adminAuth.isLogout,adminController.loadOrder)
admin_route.get('/singleOrder',adminAuth.isLogout,adminController.singleProductView)
admin_route.post('/changeOrderStatus',adminController.changeOrderStatus)
admin_route.post('/cancelOrder',adminController.cancelOrder)
//------------------------------------------------------------------//


//------------Coupon MANAGEMENT------------------------------------------------------//
admin_route.get('/coupon',  couponController.loadCoupon)
admin_route.get('/addCoupon',  couponController.LoadAddCoupon)
admin_route.post('/addCoupon', couponController.addCoupon)
admin_route.get('/editCoupon',couponController.LoadEditCoupon)
admin_route.post('/editCoupon',couponController.editCoupon)
admin_route.post('/listCoupon',couponController.listCoupon)

//------------------------------------------------------------------//









module.exports = admin_route;
