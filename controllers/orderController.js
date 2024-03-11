const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Razorpay= require('razorpay')
const Product = require('../models/products');
const crypto=require('crypto');
const Wallet= require('../models/walletModel')
const Coupon=require('../models/couponModel')



var instance = new Razorpay({ key_id: process.env.KEY_ID,
     key_secret: process.env.KEY_SECRET 
    })





function generateRandomOrderId() {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0].replace(/-/g, '');

    const randomNum = Math.floor(Math.random() * 90000) + 10000;

 
    const orderId = `ORD${formattedDate}${randomNum}`;

    return orderId;
}

//------------------placing the order-------------------------------------------------------//

const placeOrder = async (req, res) => {
    try {
        console.log("Request received at /placeOrder");
        const { index, payment, subTotal,couponCode } = req.body;
        console.log("couponCode",couponCode);
        const userId = req.session.user.id;
        console.log("user", payment);

        const cart = await Cart.findOne({ userId }).populate('products.productId');
        const products = cart.products;

        const quantityLessProduct = products.find(pro => pro.productId.stock <= 0);

        if (quantityLessProduct) {
            console.log("Quantity less:", quantityLessProduct.productId.name);
            return res.json({ quan: true, quantityLess: quantityLessProduct.productId.name });
        } else {
            console.log("No quantity less products");
        }
  if (payment.toLowerCase() === 'cod' && subTotal > 1000) {
    return res.json({ cash: true,  });
        }
        const user = await User.findOne({ _id: userId });
        const status = payment.toLowerCase() === 'cod' ? 'placed' : 'pending'; 
        console.log("status", status);
        const address = user.address[index];
        const date = Date.now();
        const expectedDate = new Date(date);
        expectedDate.setDate(expectedDate.getDate() + 7);
       
        // Generate a random order ID
        const orderId = generateRandomOrderId();

        const order = new Order({
            userId: userId,
            orderId: orderId,
            products: products,
            totalAmount: subTotal,
            date: date,
            deliveryAddress: address,
            paymentMethod: payment,
            expectedDate: expectedDate,

        });

        order.products.forEach(product => {
            product.status = status;
        });

        const orderDetails = await order.save();
        console.log("orderDetails", orderDetails);

        const coupon = await Coupon.findOne({code:couponCode})
        console.log("couponCode",coupon);
        if(coupon){
          coupon.userUsed.push({userId:userId})
          await coupon.save()
          let discount = 0;
          const disc = coupon.discount/cart.products.length
          discount = Math.round(disc)
          await Order.findOneAndUpdate({orderId:orderId},{$set:{coupon:discount}})
        }
      

        // Payment with wallet
        if (orderDetails.paymentMethod.toLowerCase() === 'wallet') {
            try {
                console.log("Wallet payment logic");
               const{subTotal}=req.body;
               const userId= req.session.user.id;
               const date=Date.now()
              const wallet= await Wallet.findOne({userId:userId})
           
               if(subTotal<wallet.amount){
                console.log("that is true");
                await Wallet.findOneAndUpdate({userId:userId},
                    {$inc:{amount:-subTotal},
                    $push: {
                    walletHistory: {
                        date: date,
                        debit:subTotal,
                        orderId2:orderId
                    }
                }
            })
            
            const orderData = await Order.findOneAndUpdate(
                
                {
                  orderId:orderId ,
                  "products.productId": { $in:order.products.map(p => p.productId) },
                },
                {
                  $set: {
                    "products.$.status": "success",
                  
                  },
                },
                { new: true }
             
              );
              
             
                await Cart.deleteOne({ userId: userId });
                for (let i = 0; i < products.length; i++) {
                    const productId = products[i].productId;
                    const productQuantity = products[i].quantity;
                    await Product.updateOne({ _id: productId }, { $inc: { stock: -productQuantity } });
                }
               
                res.json({wallet:true,orderId})
            }else{
              res.json({money:true})
            }
                
               
            } catch (error) {
                console.error("Error processing wallet payment:", error);
                return res.redirect('/error404');
            }
        }

       if (orderDetails.paymentMethod.toLowerCase() === 'cod') {
            
            const isPlacedProduct = orderDetails.products.some(product => product.status === 'placed');

           
            if (isPlacedProduct  ) {
                if(subTotal>1000){
                    console.log("condition satisfied");
                    return res.json({  message: "No product with status 'placed'" });
                }
                await Cart.deleteOne({ userId: userId });

                for (let i = 0; i < products.length; i++) {
                    const productId = products[i].productId;
                    const productQuantity = products[i].quantity;
                    await Product.updateOne({ _id: productId }, { $inc: { stock: -productQuantity } });
                }

                return res.json({ success: true, orderId });
            } else {
               
                return res.json({ success: false, message: "No product with status 'placed'" });
            }
        }
        // If the payment is Razorpay
        else if (orderDetails.paymentMethod.toLowerCase() === 'razorpay') {
            console.log("Razorpay payment logic");
         

            const options = {
                amount: subTotal * 100,
                currency: "INR",
                receipt: "" + orderId,
            };

            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Error creating Razorpay order" });
                }
                console.log("Razorpay Response:", order);
                return res.json({ order });
            });
        }
    } catch (error) {
        console.error("Error processing order:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};




//------------------------------------------------------------------------------------------------------------//
//-----------verifyPayment---------------------------------------------------------------------------------------//

const verifyPayment = async (req, res) => {
    try {
      const { payment, order } = req.body;
      const userId = req.session.user.id;
      console.log(req.body);
  
      const hmac = crypto.createHmac('sha256', 'DFdmFkjkW8ql4mWf7bsNnnEe');
      hmac.update(payment.razorpay_order_id + '|' + payment.razorpay_payment_id);
      const hmacValue = hmac.digest('hex');
  
      console.log(payment.razorpay_payment_id);
      console.log(payment.razorpay_order_id);
      console.log(hmacValue);
      console.log(payment.razorpay_signature);
  
      if (hmacValue === payment.razorpay_signature) {
        const cart = await Cart.findOne({ userId: userId }).populate("products.productId");
        console.log("hloooo");
        console.log(cart);
        const product = cart.products;
  
        for (let i = 0; i < product.length; i++) {
          const productId = product[i].productId;
          const productQuantity = product[i].quantity;
          await Product.updateOne({ _id: productId }, { $inc: { stock: -productQuantity } });
        }
  
        console.log("order_reeci", order.receipt);
        const orderData = await Order.findOneAndUpdate(
          {
            orderId: order.receipt,
            "products.productId": { $in: product.map(p => p.productId) },
          },
          {
            $set: {
              "products.$.status": "success",
              paymentId: payment.razorpay_payment_id,
            },
          },
          { new: true }
        );
  
        console.log("Order updated successfully:", orderData);
  
        await Cart.deleteOne({ userId: userId });
        res.json({ paymentSuccess: true });
      } 
    } catch (error) {
      console.log(error);
    }
  };
  
//--------------------------------------------------------------------------------------------------//
//-----------Load order Sucess---------------------------------------------------------------------------------------//


const loadOrderSuccess = async (req, res) => {
  try {
    const orderId = req.params.id;
   // console.log("this",orderId);
    const order = await Order.findOne({ orderId });
   // console.log("order", order);

    let orderedProducts = [];
   
    if (order) {
      const productIds = order.products.map(product => product.productId);
      const products = await Product.find({ _id: { $in: productIds } });

      orderedProducts = order.products.map(orderProduct => {
        const productDetails = products.find(product => product._id.equals(orderProduct.productId));
        return {
          quantity: orderProduct.quantity,
          ...productDetails.toObject()
        };
      });

     
    }

    res.render('orderSuccess', { orderId, orderedProducts});
  } catch (error) {
    console.log(error.message);
    res.render('orderSuccess', { orderId: null, orderedProducts: []});
  }
}
  //------------------------------------------------------------------------------------------//
  //---------------Load order details page---------------------------------------------------------------------------//
  const loadOrderDetilas = async (req, res) => {
    try {
        const orderId = req.params.id;
      //  console.log("this ",orderId);

        const order = await Order.findOne({ orderId });
       console.log("order", order);
        if (order) {
            const productIds = order.products.map(product => product.productId);

            const orderedProducts = await Product.aggregate([
                {
                    $match: {
                        _id: { $in: productIds }
                    }
                },
                {
                    $addFields: {
                        quantity: {
                            $arrayElemAt: [
                                {
                                    $filter: {
                                        input: order.products,
                                        as: "orderProduct",
                                        cond: {
                                            $eq: ["$$orderProduct.productId", "$_id"]
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    }
                }
            ]);
            
                //  console.log("orderDetails",orderedProducts);
            res.render('orderDetails', { order, orderedProducts });
        }
    } catch (error) {
        // Handle errors, you might want to send an error response or render an error page
        console.error(error);
        res.redirect('error404');
    }
};



//--------------------------------------------------------------------------------------------------//
//-------------Cancel Orders--------------------------------------------------------//


const cancelOrder = async (req, res) => {
    try {
        const { orderId, productId, cancelReason, couponDis } = req.body;
        console.log(req.body);
        const userId = req.session.user.id;
        console.log(userId);

        const orderData = await Order.findOneAndUpdate(
            { orderId: orderId, 'products.productId': productId },
            {
                $set: {
                    'products.$.status': 'cancelled',
                    'products.$.cancelReason': cancelReason,
                },
            },
            { new: true }
        );

        const productDetails = await Order.findOne(
            { orderId: orderId, 'products.productId': productId },
            { 'products.$': 1 }
        ).populate('products.productId');

        const totalAmount = productDetails.products[0].productId.price * productDetails.products[0].quantity;

        // Calculate discount amount as a percentage of the product price
        const discountPercentage = (couponDis / totalAmount) * 100;
        const discountAmount = (discountPercentage / 100) * totalAmount;

        if (orderData.paymentMethod === 'razorpay' || orderData.paymentMethod === 'wallet') {
            console.log("I am here above wallet");

            const userWallet = await Wallet.findOne({ userId: userId });
            const date = Date.now();

            if (userWallet) {
                const walletUpdateResult = await Wallet.findOneAndUpdate(
                    { userId: userId },
                    {
                        $inc: { amount: totalAmount - discountAmount }, // Deduct the discount amount
                        $push: {
                            walletHistory: {
                                date: date,
                                credit:totalAmount - discountAmount,
                                orderId2:orderId,
                                reason:cancelReason
                                
                            }
                        }
                    },
                    { new: true }
                );

                console.log(userId);
                console.log(totalAmount - discountAmount);
                console.log(walletUpdateResult);

                if (walletUpdateResult) {
                    console.log("Wallet updated successfully");
                } else {
                    console.log("Wallet not updated");
                }
            } else {
                const date = Date.now();
                const newWallet = new Wallet({
                    userId: userId,
                    amount: totalAmount - discountAmount, // Deduct the discount amount
                    walletHistory: [{ date: date, 
                        orderData: discountAmount,
                        orderId2:orderId,
                        reason:cancelReason }]
                });
                await newWallet.save();
                console.log("New wallet created and updated successfully");
            }
        }

        const productQty = productDetails.products[0].quantity;
        await Product.updateOne({ _id: productId }, { $inc: { stock: productQty } });
        res.json({ cancel: true, orderId });
    } catch (error) {
        console.error(error.message);
        res.redirect('/error404');
    }
};

//--------------------------------------------------------------------------------------------------//
//---------------Return order-----------------------------------------------------------------------------------//
 // const returnOrder= async (req,res)=>{
//  try {
//     const { orderId, productId, returnReason } = req.body;
//     console.log(req.body);
//     const userId = req.session.user.id;
//     console.log(userId);
       
//     const orderData = await Order.findOneAndUpdate(
//         { _id: orderId, 'products.productId': productId },
//         {
//             $set: {
//                 'products.$.status': 'returned',
//                 'products.$.returnReason': returnReason,
//             },
//         },
//         { new: true }
//     );
//     console.log(orderData);
//     const productDetails = await Order.findOne(
//         { _id: orderId, 'products.productId': productId },
//         { 'products.$': 1 }
//       ).populate('products.productId')
//     const totalAmount= productDetails.products[0].productId.price * productDetails.products[0].quantity;
//     if(orderData.paymentMethod == 'razorpay' || orderData.paymentMethod == 'wallet'||orderData.paymentMethod == 'COD'){
    
   
         
//            console.log("I am here above wallet");

         
//            const userWallet = await Wallet.findOne({ userId: userId });
//             const date= Date.now();
//            if (userWallet) {
//                const walletUpdateResult = await Wallet.findOneAndUpdate(
//                    { userId: userId },
//                    {
//                        $inc: { amount: totalAmount },
//                        $push: {
//                            walletHistory: {
//                             date: date,
//                                orderData: orderData.products
//                            }
//                        }
//                    },
//                    { new: true }
//                );
           
//                console.log(userId);
//                console.log(totalAmount);
//                console.log(walletUpdateResult);
           
//                if (walletUpdateResult) {
//                    console.log("Wallet updated successfully");
//                } else {
//                    console.log("Wallet not updated");
//                }
//            } else {
//                // Create a new wallet document
               
//                const newWallet = new Wallet({
//                    userId: userId,
//                    amount: totalAmount,
                 
//                    walletHistory: [{ date: date, orderData: orderData.products}]
//                });
//                await newWallet.save();
//                console.log("New wallet created and updated successfully");
//            }
  
                   


// }

//         res.json({ return: true });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// }
const returnOrder = async (req, res) => {
    try {
      const { orderId, productId,  returnReason } = req.body;
      console.log(req.body);
      const userId = req.session.user.id;
  
      if (userId) {
        return Order.findOneAndUpdate(
          { _id: orderId, "products.productId": productId },
          {
            $set: {
              
              [`products.$.returnReason`]: returnReason,
              [`products.$.status`]:  "returnRequested",
            },
          }
        ).then(() => {
          res.json({ return: true });
        });
      }
    } catch (error) {
      console.log(error);
    }
  
  };
 

//--------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------//
const refundPolicy=async(req,res)=>{
    try {
        res.render('refundPOlicy');
        
    } catch (error) {
        console.log(error);
    }
}
//--------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------//
const loadInvoice = async (req, res) => {
    try {
    let id= req.params.id
console.log("invoice",id);
  
const order = await Order.findOne({ orderId: id }).populate('products.productId').populate('userId').populate('products.quantity');
console.log(order);
     
      const populatedProducts = order.products.map(product => product.productId);


      console.log("inve",order.products);
      
      res.render('invoice',{ order: order,orderProduct:order.products,products:populatedProducts });
    } catch (error) {
      console.log(error.message);
    }
  };

//--------------------------------------------------------------------------------------------------//
//------ PaymentCountinue --------------------------------------------------------------------------------------------//



const PaymentCountinue = async (req, res) => {
    try {
        console.log("payment continue");
        console.log("Request Body:", req.body);
        const { orderId } = req.body;
        console.log("Finding Order for OrderId:", orderId);
        const order = await Order.findOne({ orderId: orderId }).populate('userId');
        console.log("Found Order:", order);

        const option = {
            amount: order.totalAmount * 100,
            currency: "INR",
            receipt: "" + order.orderId,
        };

        instance.orders.create(option, function (err, order) {
            if (err) {
                // Handle the error appropriately
                console.error("Error creating order:", err);
                res.status(500).json({ error: "Failed to create order" });
                return;
            }
            console.log("Order created:", order);
            res.json({ order: order });
        });
    } catch (error) {
        console.error("Error in PaymentCountinue:", error);
        res.status(500).redirect('/error404');
    }
}

    
//--------------------------------------------------------------------------------------------------// 
//----CountinueVerify-payment----------------------------------------------------------------------------------------------// 
const CountinuePayment = async (req, res) => {
    try {
      const userId = req.session.user.id;
      console.log(userId);
      const { payment, order } = req.body;
      const hmac = crypto.createHmac('sha256', 'DFdmFkjkW8ql4mWf7bsNnnEe');
      hmac.update(payment.razorpay_order_id + '|' + payment.razorpay_payment_id);
      const hmacValue = hmac.digest('hex');
      console.log(hmacValue);
      console.log(payment.razorpay_signature);
      if (hmacValue === payment.razorpay_signature) {
        console.log(order.orderId);
        const orderDetails = await Order.findOne({ orderId:order.receipt }).populate("products.productId");
  console.log(orderDetails);
        const products = orderDetails.products;
  
        for (let i = 0; i < products.length; i++) {
          const productId = products[i].productId;
          const productQuantity = products[i].quantity;
  
          // Update the stock of the product
          await Product.updateOne({ _id: productId }, { $inc: { stock: -productQuantity } });
        }
  
        // Update the order status and paymentId
        const updatedOrder = await Order.findOneAndUpdate(
          {
            orderId: order.receipt,
            "products.productId": { $in: products.map(p => p.productId) },
          },
          {
            $set: {
              "products.$.status": "success",
              paymentId: payment.razorpay_payment_id,
            },
          },
          { new: true }
        );
  
        console.log("Order updated successfully:", updatedOrder);
  
        res.json({ paymentSuccess: true });
      } else {
        const changedOrder = await Order.findByIdAndUpdate(
          { orderId: order.receipt },
          {
            $set: {
              "products.$.status": "pending",
            },
          }
        );
  
        console.log("changedOrder", changedOrder);
        res.redirect('/error404');
      }
    } catch (error) {
      res.redirect('/error404');
    }
  };
  
//--------------------------------------------------------------------------------------------------//


  module.exports={
    placeOrder,
    loadOrderSuccess,
    loadOrderDetilas,
    cancelOrder,
    verifyPayment,
    returnOrder,
     refundPolicy,
 loadInvoice,
 PaymentCountinue,
 CountinuePayment
  }