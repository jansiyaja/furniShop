const User=require("../models/userModel");
const bcrypt=require("bcrypt");
const Order=require('../models/orderModel')

//----------------AdminLogin--------------------------//

const adminLogin = (req, res) => {
    const adminCredential = {
        email: 'admin@gmail.com', 
        password: 'admin', 
    };

    if (req.body.email === adminCredential.email && req.body.password === adminCredential.password) {
        req.session.admin = req.body.email;
        res.redirect('/admin/dashboard');
    } else if (req.body.email !== adminCredential.email && req.body.password === adminCredential.password) {
        res.render('login', { title: "Express", logout: "Invalid Admin Email" });
    } else if (req.body.email === adminCredential.email && req.body.password !== adminCredential.password) {
        res.render('login', { title: "Express", logout: "Invalid Admin Password" });
    } else {
        res.render('login', { title: "Express", logout: "Invalid Admin Credentials" });
    }
};
//------------------------------------------------------------------------------------------------//
//-----------Load Home page-- And LOad customer-----------------------------------------------------------------------------------//
const loadHome=async(req,res)=>{
    res.render('dashboard')
};
const loadCustomer=async(req,res)=>{
    res.render('customers')
};
//------------------------------------------------------------------------------------------------//
//-------------------------Admin Logout-----------------------------------------------------------------------//

const adminLogout= async(req,res)=>{
    try {
        if(req.session){
          req.session.destroy((err)=>{
              if(err) {
                  // return next(err);
                  return res.redirect('/admin/login');
              }
              else{
                return res.redirect('/admin/login');
                 
              }
          })
       }
        
      } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
      };
    };

    const userManagementSystem = async (req,res)=>{
        try {
          let page =1;
          if(req.query.id){
            page=req.query.id
          }
          let limit = 6;
          let next = page+1;
          let previous = page>1 ? page-1 : 1
      
          const count  = await User.find({
            is_admin:0
          }).count()
      
         let totalPages = Math.ceil(count/limit)
         if(next>totalPages){
          next=totalPages
         } 
      
          const user = await User.find({
            is_admin:0,
            
          }).limit(limit)
          .skip((page-1)*limit)
          .exec()
      
            res.render('customers',{users:user,
              page:page,
              previous:previous,
              next:next,
              totalPages:totalPages
            })
        } catch (error) {
          console.log(error.message);
        }
      };
      const blockUser = async (req, res) => {
        try {
            const id = req.body.id;
            let user = await User.findOne({ _id: id });
    
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
    
            const newBlockedStatus = !user.Blocked;
    
            await User.updateOne({ _id: id }, { $set: { Blocked: newBlockedStatus } });
    
            res.json({ block: true, newBlockedStatus });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
      
    const loadOrder = async (req, res) => {
      try {
        const order = await Order.find({})
          .populate('userId')
          .populate('products.productId')
          .sort({ date: -1 })
        res.render('OrderList', { order: order })
      } catch (error) {
        console.log(error.message);
      }
    } 
    
    const singleProductView = async (req, res) => {
      try {
        const orderId = req.query.orderId
        const order = await Order.findOne({ _id: orderId }).populate('userId').populate('products.productId')
        res.render('singleOrder', { order: order })
      } catch (error) {
        console.log(error.message);
      }
    }
   
  
    const changeOrderStatus = async (req, res) => {
      try {
        const { orderId, productId, status, userId } = req.body;
        console.log('Received request to change order status:', orderId, productId, status, userId);
        
          const orderData = await Order.findOneAndUpdate(
              { _id: orderId, userId: userId, 'products.productId': productId },
              { $set: {
                'products.$.status': status,
                
            } },
              { new: true }
          );
  
          console.log('Updated order data:', orderData);
          res.json({ change: true, orderData });
  
      } catch (error) {
          console.log(error.message);
          res.status(500).json({ change: false, error: error.message });
      }
  }
  
  

module.exports={
    adminLogin,
    loadHome,
    loadCustomer,
    adminLogout,
    userManagementSystem,
   blockUser,
   loadOrder,
   singleProductView,
   changeOrderStatus,

}