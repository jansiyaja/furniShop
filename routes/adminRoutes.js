
const express = require("express")
const nocache = require("nocache");
const admin_route = express()
const multer = require('../middleware/multer')
const adminAuth = require('../middleware/adminAuth')

const session = require('express-session');
admin_route.set('view engine','ejs')
admin_route.set('views','./views/Admin')
const config = require('../config/config');


admin_route.use(nocache());

//----controllers-------------//

const adminController = require('../controllers/adminController')
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const couponController = require('../controllers/couponController')
const offerController = require('../controllers/offerController')

//-----------------------------------------------------------//



admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

admin_route.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);









//admin_route.get('/login', adminAuth.isLogin, adminController.adminLogin)
admin_route.get('/login',adminAuth.login, adminController.adminLogin);
admin_route.post(['/login', ], adminController.adminLogin);

admin_route.get('/logout',adminController.adminLogout)

// admin_route.get('/dashboard',adminController.loadHome)
admin_route.get('/dashboard', adminAuth.isLogout, adminController.loadHome)
admin_route.get('/customers',adminAuth.isLogout,adminController.userManagementSystem)
admin_route.post('/blockUser',adminController.blockUser)

//---------------------- product session-----------------------------------------//

admin_route.get('/Products',adminAuth.isLogout,productController.loadProduct)
admin_route.get('/addProduct',adminAuth.isLogout,productController.loadaddProduct)
admin_route.post('/addProduct',multer.array('images'),productController.addProduct)
admin_route.get('/editProduct',adminAuth.isLogout,productController.editProductLoad)
admin_route.post('/editProduct',multer.array('images'),productController.editProduct)

admin_route.post('/listproduct',productController.listUnlist)

//-------------------------------------------------------------------//


//---------------------- cateory session-----------------------------------------//
admin_route.get('/category',adminAuth.isLogout,categoryController.loadCategory)
admin_route.get('/addCategory',adminAuth.isLogout,  categoryController.loadaddCategory)
admin_route.post('/addCategory', categoryController.insertCategory)
admin_route.post('/listCategory',categoryController.listCategory)
admin_route.get('/editCategory',adminAuth.isLogout,categoryController.LoadEditCategory)
admin_route.post('/editCategory',categoryController.editCategory)

//------------------------------------------------------------------//
//------------ Offer session------------------------------------------------------//
admin_route.get('/Offer',adminAuth.isLogout,offerController.loadOffer)
admin_route.get('/addOffer',adminAuth.isLogout,  offerController.loadaddOffer)
admin_route.post('/addOffer',adminAuth.isLogout,  offerController.addOffer)
admin_route.get('/editOffer',adminAuth.isLogout,offerController.loadEditOffer)
admin_route.post('/editOffer',adminAuth.isLogout,offerController.editOffer)
admin_route.put('/listOffer',adminAuth.isLogout,offerController.listOffer)
admin_route.get('/applyOffer',adminAuth.isLogout,offerController.loadCategoryApplyOffer)
admin_route.post('/addCategoryOffer',adminAuth.isLogout,offerController.categoryApplyOffer)
admin_route.post('/removeCategoryOffer',adminAuth.isLogout,offerController.categoryRemoveOffer)

admin_route.get('/productOffer',adminAuth.isLogout,offerController.loadProductApplyOffer)
admin_route.post('/addProductOffer',adminAuth.isLogout,offerController.productApplyOffer)
admin_route.post('/removeProductOffer',adminAuth.isLogout,offerController.productRemoveOffer)
//------------------------------------------------------------------//
//-------------------Orders Management-----------------------------------------------//
admin_route.get('/orders',adminAuth.isLogout,adminController.loadOrder)
admin_route.get('/singleOrder',adminAuth.isLogout,adminController.singleProductView)
admin_route.post('/changeOrderStatus',adminController.changeOrderStatus)
admin_route.post('/cancelOrder',adminController.cancelOrder)
admin_route.post('/changeReturnStatus',adminController.changeReturnStatus)
//------------------------------------------------------------------//


//------------Coupon MANAGEMENT------------------------------------------------------//
admin_route.get('/coupon', adminAuth.isLogout, couponController.loadCoupon)
admin_route.get('/addCoupon', adminAuth.isLogout, couponController.LoadAddCoupon)
admin_route.post('/addCoupon', couponController.addCoupon)
admin_route.get('/editCoupon',adminAuth.isLogout,couponController.LoadEditCoupon)
admin_route.post('/editCoupon',couponController.editCoupon)
admin_route.post('/listCoupon',couponController.listCoupon)

//------------------------------------------------------------------//

admin_route.post('/createReport', adminController.loadCreateReport)

admin_route.get('/error',adminController.loadError)






module.exports = admin_route;
