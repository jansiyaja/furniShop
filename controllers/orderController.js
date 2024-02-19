const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Razorpay= require('razorpay')
const Product = require('../models/products');
const crypto=require('crypto')

var instance = new Razorpay({ key_id: process.env.KEY_ID,
     key_secret: process.env.KEY_SECRET 
    })





function generateRandomOrderId() {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0].replace(/-/g, '');

    const randomNum = Math.floor(Math.random() * 90000) + 10000;

    // Combine the components to form the order ID
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

        // Populate user's cart with product details
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
        const status = payment === 'COD' ? 'placed' : 'pending';
        console.log("ststuass",status);
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
       console.log("orderDetails",orderDetails);

        // If the payment is COD
        for (const product of orderDetails.products) {
            
            const productStatus = product.status;
            if (productStatus === 'placed') {
                await Cart.deleteOne({ userId: userId });

                for (let i = 0; i < products.length; i++) {
                    const productId = products[i].productId;
                    const productQuantity = products[i].quantity;
                    await Product.updateOne({ _id: productId }, { $inc: { stock: -productQuantity } });
                }

                return res.json({ success: true, orderId });
            }
            
            // If the payment is razorpay
            else if (productStatus === 'pending') {
                console.log("iam here");
                const options = {
                    amount: subTotal * 100,
                    currency: "INR",
                    receipt: "" + orderId,
                };
console.log(options);
                instance.orders.create(options, function (err, order) {
                    if (err) {
                        console.log(err);
                    }
                    console.log("Razorpay Response:", order);
                    return res.json({ order });
                });
                
            }
        }

       
    } catch (error) {
        console.log(error);
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
        console.log("this ",orderId);

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
        res.status(500).render('error', { error });
    }
};



//--------------------------------------------------------------------------------------------------//
//-------------Cancel Orders--------------------------------------------------------//

const cancelOrder = async (req, res) => {
  try {
      const { orderId, productId, cancelReason } = req.body;
      console.log(cancelReason);

     
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
      console.log(orderData);
      const productDetails = await Order.findOne(
          { _id: orderId, 'products.productId': productId },
          { 'products.$': 1 }
      );

      const productQty = productDetails.products[0].quantity;

      // Update product stock based on order
      await Product.updateOne({ _id: productId }, { $inc: { stock: productQty } });

      res.json({ cancel: true, orderId });
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

//--------------------------------------------------------------------------------------------------//


  module.exports={
    placeOrder,
    loadOrderSuccess,
    loadOrderDetilas,
    cancelOrder,
    verifyPayment
  }