const User=require("../models/userModel");
const bcrypt=require("bcrypt");
const Order=require('../models/orderModel')
const Product=require('../models/products')
const Wallet=require('../models/walletModel')
//----------------AdminLogin--------------------------//

const adminLogin = (req, res) => {
  const adminCredential = {
    email: 'admin@gmail.com',
    password: 'admin',
  };

  if (req.body.email === adminCredential.email && req.body.password === adminCredential.password) {
    req.session.admin = req.body.email;
    console.log(req.session.admin); // Log the session here
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
const loadHome = async (req, res) => {
  console.log(req.session.admin);
  const orderCount = await Order.find({}).count();
  const productCount = await Product.find({}).count();
  const orders = await Order.find();
  const users = await User.find().sort({ createdAt: -1 }).limit(3);
  const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  const monthly = await Order.aggregate([{ $match: { 'products.status': 'delivered', date: { $gt: startOfMonth, $lt: endOfMonth } } }, { $group: { _id: null, monthlyRevenue: { $sum: '$totalAmount' } } }])
  const monthlyRevenue = monthly.map((value) => value.monthlyRevenue)[0] || 0;

  const total = await Order.aggregate([
    {
      $match: {
        'products.status': 'delivered'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' }
      }
    }
  ]);
  const totalRevenue = total.length > 0 ? total[0].totalRevenue : 0;


  // getting the monthly revevue for the grapgh
  const totalMonthly = await Order.aggregate([
    {
      $match: {
        'products.status': 'delivered'
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
        
        },
        totalRevenue: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const defaultMonthly = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    
    totalRevenue: 0,
    count: 0
  }));
  
  const monthlyEarnings = defaultMonthly.map((defaultMonth) => {
    const foundMonth = totalMonthly.find((monthlyData) => monthlyData._id.month === defaultMonth.month);
    return {
      month: defaultMonth.month,
      totalRevenue: foundMonth ? foundMonth.totalRevenue : 0,
      count: foundMonth ? foundMonth.count : 0,
     
    };
  });
  
 // console.log(monthlyEarnings);
  


  
  const monthlyUser = await User.aggregate([
    {
      $match: {
        createdAt: { $exists: true } 
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
        
         
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
       
        count: 1
      }
    },
    {
      $sort: {
        month: 1,
       
      }
    }
  ]);
  
  console.log(monthlyUser);
  const userMonthly = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1, 
    count: 0
}));


const monthlyUserCounts = userMonthly.map((defaultMonth) => {
   
    const foundMonth = monthlyUser.find((monthlyData) => monthlyData.month === defaultMonth.month);
    
    return {
        month: defaultMonth.month,
        count: foundMonth ? foundMonth.count : 0,
    };
});

//console.log(monthlyUserCounts);
// ----------end the first data-------------------------------//
const pipeline = [
  {
       $match: {
           'products.status': 'delivered',
       }
  },
  { $unwind: '$products' },
  {
       $lookup: {
           from: 'products',
           localField: 'products.productId',
           foreignField: '_id',
           as: 'product'
       }
  },
  { $unwind: '$product' },
  {
       $lookup: {
           from: 'categories',
           localField: 'product.category',
           foreignField: '_id',
           as: 'category'
       }
  },
  { $unwind: '$category' },
  {
       $group: {
           _id: {
               productId: '$products.productId',
               productName: '$product.name',
               productImage: '$product.images', 
               categoryName: '$category.name'
           },
           count: { $sum: 1 }
       }
  },
  {
       $sort: {
           count: -1
       }
  },
  {
       $limit: 5
  },
  {
       $project: {
           _id: 0,
           productId: '$_id.productId',
           productName: '$_id.productName',
           productImage: '$_id.productImage', 
           categoryName: '$_id.categoryName',
           count: 1
       }
  }
 ];
 
 const top5Products = await Order.aggregate(pipeline);
 //console.log(top5Products);
 
// ----------start the second graph-------------------------------//


  const statuses = ['delivered', 'cancelled', 'returned', 'pending', 'placed'];

const statusCounts = {};

await Promise.all(
  statuses.map(async (status) => {
    const countResult = await Order.aggregate([
      {
        $match: {
          'products.status': status
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    const count = countResult.length > 0 ? countResult[0].count : 0;
    statusCounts[status] = count;
  })
);
  
 //console.log(statusCounts.delivered);
  
 

  res.render('dashboard', {
    orderCount,
    productCount,
    totalRevenue,
    monthlyEarnings,
    monthlyRevenue,
    orders,
    statusCounts,
    users,
    monthlyUserCounts,
    top5Products
  
    
  });
};


//----------------Load-- loadCustomer------------------------------------------------------------------------------//
//------------------------------------------------------------------------------------------------//
const loadCustomer=async(req,res)=>{
    res.render('customers')
};
//------------------------------------------------------------------------------------------------//
//-------------------------Admin Logout-----------------------------------------------------------------------//
const adminLogout = async (req, res) => {
  try {
    console.log(req.session.admin, "hlo");
    req.session.admin = null; // Clear the session
    res.redirect('/admin/login');
  } catch (error) {
    console.log(error.message);
  }
}
//------------------------------------------------------------------------------------------------//
//----------userManagementSystem--------------------------------------------------------------------------------------//

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
//------------------------------------------------------------------------------------------------//
//------blockUser------------------------------------------------------------------------------------------//

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
//------------------------------------------------------------------------------------------------//
//-----------loadOrder-------------------------------------------------------------------------------------//
      
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
//------------------------------------------------------------------------------------------------//
//------------singleProductView------------------------------------------------------------------------------------//
    
    const singleProductView = async (req, res) => {
      try {
        const orderId = req.query.orderId
        const order = await Order.findOne({ _id: orderId }).populate('userId').populate('products.productId')
        res.render('singleOrder', { order: order })
      } catch (error) {
        console.log(error.message);
      }
    }
   
//------------------------------------------------------------------------------------------------//
//----------changeOrderStatus--------------------------------------------------------------------------------------//
  
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

  
  
//------------------------------------------------------------------------------------------------//
//----------changeReturnStatus--------------------------------------------------------------------------------------//
const changeReturnStatus = async (req, res) => {
  try {
      console.log("hehe");
      const { orderId, productId, status, userId, retunRerason } = req.body;
    //  console.log(req.body);

      if (status == 'returned') {
          const user = await User.findOne({ _id: userId });
          if (user) {
              const order = await Order.findOne({ _id: orderId });
              
              const orderid = order.orderId;
             

              const productDetails = await Order.findOne(
                  { _id: orderId, 'products.productId': productId },
                  { 'products.$': 1 }
              ).populate('products.productId');
             

              let amount;

              if (order.couponApplied) {
                  // If coupon is applied
                  amount = productDetails.products[0].productId.price * productDetails.products[0].quantity - order.coupon;
                 

                  const walletUpdateResult = await Wallet.findOneAndUpdate(
                      { userId: userId },
                      {
                          $inc: { amount: amount },
                          $push: {
                              walletHistory: {
                                  date: Date.now(),
                                  credit: amount,
                                  reason: retunRerason,
                                  orderId2: orderid
                              }
                          }
                      },
                      { new: true }
                  );

                  if (walletUpdateResult) {
                      console.log("Wallet updated successfully");
                  }
              } else {
                  
                  amount = productDetails.products[0].productId.price * productDetails.products[0].quantity;
                 

                  
                  const existingWallet = await Wallet.findOne({ userId: userId });

                  if (existingWallet) {
                     
                      const walletUpdateResult = await Wallet.findOneAndUpdate(
                          { userId: userId },
                          {
                              $inc: { amount: amount },
                              $push: {
                                  walletHistory: {
                                      date: Date.now(),
                                      credit: amount,
                                      reason: retunRerason,
                                      orderId2: orderid
                                  }
                              }
                          },
                          { new: true }
                      );

                      if (walletUpdateResult) {
                          console.log("Wallet updated successfully");
                      }
                  } else {
                      // Create new wallet if the user doesn't have one
                      const newWallet = new Wallet({
                          userId: userId,
                          amount: amount,
                          walletHistory: [{
                              date: Date.now(),
                              credit: amount,
                              reason: retunRerason,
                              orderId2: orderid
                          }]
                      });

                      await newWallet.save();
                      console.log("New wallet created and updated successfully");
                  }
              }

              await Order.findOneAndUpdate(
                  { _id: orderId, 'products.productId': productId },
                  { 'products.$.status': status }
              );

              await Product.findOneAndUpdate({ _id: productId }, { $inc: { stock: 1 } });
              res.json({ changed: true });
          }
      } else {
          await Order.findOneAndUpdate(
              { orderId: orderId, 'products.productId': productId },
              { 'products.$.status': status }
          );
          res.json({ changed: true });
      }
  } catch (error) {
      console.log(error.message);
  }
};

//-------------cancelOrder-----------------------------------------------------------------------------------//
//------------------------------------------------------------------------------------------------//
const cancelOrder = async (req, res) => {
  try {
    const { orderId, productId } = req.body;

    const orderData = await Order.findOneAndUpdate(
      { OrderId: orderId, 'products.productId': productId },
      { $set: { 'products.$.status': 'cancelled' } })
    const productDetails = await Order.findOne(
      { OrderId: orderId, 'products.productId': productId },
      { 'products.$': 1 }
    );

    const productQty = productDetails.products[0].quantity;

    await Product.updateOne({ _id: productId }, { $inc: { stock: productQty } })
    res.json({ cancel: true })
  } catch (error) {
    console.log(error.message);
  }
}
//------------------------------------------------------------------------------------------------//
//------------------------------------------------------------------------------------------------//

const loadCreateReport = async (req, res) => {
  try {
    const startDate = new Date(req.body.startDate);
    
   
    const endDate = new Date(req.body.endDate);
    endDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('userId').populate('products.productId');

    res.render('report', { orders });
  } catch (error) {
    console.log(error.message);
  }
};



//------------------------------------------------------------------------------------------------//
//---Load the error page---------------------------------------------------------------------------------------------//
const loadError= async(req,res)=>{
  try {
    res.render('error404')
  } catch (error) {
    console.log(error);
  }
}

//------------------------------------------------------------------------------------------------//

//------------------------------------------------------------------------------------------------//
  

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
   changeReturnStatus,
   cancelOrder,
   loadCreateReport,
   loadError
  
}