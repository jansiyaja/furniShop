const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Razorpay= require('razorpay')
const Product = require('../models/products');
const crypto=require('crypto');
const Wallet= require('../models/walletModel')

const Return= require('../models/returnModel')


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
        const { index, payment, subTotal } = req.body;
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

        // Payment with wallet
        if (orderDetails.paymentMethod.toLowerCase() === 'wallet') {
            try {
                console.log("Wallet payment logic");
               const{subTotal}=req.body;
               const userId= req.session.user.id;
               const date=Date.now()
              const wallet= await Wallet.findOne({userId:userId})
           
               if(subTotal<=wallet.amount){
                console.log("that is true");
                await Wallet.findOneAndUpdate({userId:userId},
                    {$inc:{amount:-subTotal},
                    $push: {
                    walletHistory: {
                        Date: date,
                        orderData: orderDetails.products
                    }
                }
            })
              
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
                return res.status(500).json({ error: "Internal server error" });
            }
        }
        else if (orderDetails.paymentMethod.toLowerCase() === 'cod') {
            
            const isPlacedProduct = orderDetails.products.some(product => product.status === 'placed');

            if (isPlacedProduct) {
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

const verifyPayment=async (req,res)=>{
    try {
       
       const {payment,order}=req.body
       const userId= req.session.user.id
       console.log(req.body);
    
      
          
          const hmac =crypto.createHmac('sha256','rGcgr29VFBonUpNpWdysSxoE' );
          console.log();
          
      hmac.update(payment.razorpay_order_id+'|'+payment.razorpay_payment_id);
        const  hmacValue=hmac.digest('hex')

        console.log(payment.razorpay_payment_id);
        console.log(payment.razorpay_order_id);
        console.log(hmacValue);
        console.log(payment.razorpay_signature);
        if (hmacValue === payment.razorpay_signature) {

            const cart= await Cart.findOne({userId:userId}).populate("products.productId")
            console.log("hloooo");
            console.log(cart);
            const product=cart.products;
            for (let i=0;i<product.length;i++){
                const productId= product[i].oroductId  ;
                const productQuantity = product[i].quantity;
                await Product.updateOne({ _id: productId }, { $inc: { stock: -productQuantity } });
            }
          const result=  await Order.findOneAndUpdate({OrderId:order.receipt}, 
              
                { $set: 
                {"products.$.status": "placed", 
                paymentId: payment.razorpay_payment_id }
            },
            { new: true } 
            );
            if (result) {
                console.log("Order updated successfully:", result);
            }
            await Cart.deleteOne({ userId: userId })
            res.json({ paymentSuccess: true })
         }
         

    } catch (error) {
        console.log(error);
    }
  
}
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
      //  console.log("order", order);
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
        res.status(500).render('error', { error });
    }
};



//--------------------------------------------------------------------------------------------------//
//-------------Cancel Orders--------------------------------------------------------//

const cancelOrder = async (req, res) => {
    try {
        const { orderId, productId, cancelReason } = req.body;
        console.log(req.body);
        const userId = req.session.user.id;
        console.log(userId);

       

        const orderData = await Order.findOneAndUpdate(
            { _id: orderId, 'products.productId': productId },
            {
                $set: {
                    'products.$.status': 'cancelled',
                    'products.$.cancelReason': cancelReason,
                },
            },
            { new: true }
        );
       // console.log(orderData);
        
      
            const productDetails = await Order.findOne(
                { _id: orderId, 'products.productId': productId },
                { 'products.$': 1 }
              ).populate('products.productId')

           
            const totalAmount= productDetails.products[0].productId.price * productDetails.products[0].quantity;
            if(orderData.paymentMethod == 'razorpay' || orderData.paymentMethod == 'wallet'){
            
           
                 
                   console.log("I am here above wallet");
       
                 
                   const userWallet = await Wallet.findOne({ userId: userId });
                    const date=Date.now()
                   if (userWallet) {
                       const walletUpdateResult = await Wallet.findOneAndUpdate(
                           { userId: userId },
                           {
                               $inc: { amount: totalAmount },
                               $push: {
                                   walletHistory: {
                                    date: date,
                                       orderData: orderData.products
                                   }
                               }
                           },
                           { new: true }
                       );
                   
                       console.log(userId);
                       console.log(totalAmount);
                       console.log(walletUpdateResult);
                   
                       if (walletUpdateResult) {
                           console.log("Wallet updated successfully");
                       } else {
                           console.log("Wallet not updated");
                       }
                   } else {
                       const date=Date.now()
                       const newWallet = new Wallet({
                           userId: userId,
                           amount: totalAmount,
                           walletHistory: [{ date:date, orderData: orderData.products}]
                       });
                       await newWallet.save();
                       console.log("New wallet created and updated successfully");
                   }
          
                           

       
    }
    const productQty = productDetails.products[0].quantity;
    await Product.updateOne({ _id: productId }, { $inc: { stock: productQty } }); 
    res.json({ cancel: true, orderId });
 }catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
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
      const { orderId, productId, returnReason } = req.body;
      const userId = req.session.user.id;
  
      // Update order products' return status
      const orderData = await Order.findOneAndUpdate(
        { _id: orderId, 'products.productId': productId },
        {
          $set: {
            'products.$.status': 'returnRequested',
            'products.$.returnReason': returnReason,
          },
        },
        { new: true }
      );
  
      
      const returnData = new Return({
        orderId,
        productId,
        returnStatus: 'requested', // Set to 'requested' initially
        userId,
        date: Date.now(),
      });
  
      
      const totalAmount = orderData.products.find((product) => product.productId.equals(productId)).price * orderData.products.find((product) => product.productId.equals(productId)).quantity;
  console.log("totalAmount",totalAmount);
      if (orderData.paymentMethod === 'razorpay' || orderData.paymentMethod === 'wallet' || orderData.paymentMethod === 'cod') {
        console.log("I am here above wallet");
        const userWallet = await Wallet.findOne({ userId: userId });
        const date = Date.now();
  
        if (userWallet) {
          const walletUpdateResult = await Wallet.findOneAndUpdate(
            { userId: userId },
            {
              $inc: { amount: totalAmount },
              $push: {
                walletHistory: {
                  date: date,
                  orderData: orderData.products,
                },
              },
            },
            { new: true }
          );
  
          console.log(userId);
          console.log(totalAmount);
          console.log(walletUpdateResult);
  
          if (walletUpdateResult) {
           
            await Return.findByIdAndUpdate(returnData._id, { returnStatus: 'accepted' });
          } else {
            console.log("Wallet not updated");
          }
        } else {
          // Create a new wallet document
          const newWallet = new Wallet({
            userId: userId,
            amount: totalAmount,
            walletHistory: [{ date: date, orderData: orderData.products }],
          });
          await newWallet.save();
          console.log("New wallet created and updated successfully");
        }
      }
  
      res.json({ return: true, returnData });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
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


  module.exports={
    placeOrder,
    loadOrderSuccess,
    loadOrderDetilas,
    cancelOrder,
    verifyPayment,
    returnOrder,
     refundPolicy
  }