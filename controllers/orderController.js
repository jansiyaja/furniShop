const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const Order = require('../models/orderModel')

const Product = require('../models/products');


//------------------placing the order-------------------------------------------------------//
const placeOrder = async (req, res) => {
    try {
      const {
        index,
        payment,
        subTotal
      } = req.body;
      const userid = req.session.user.id;
      const cart = await Cart.findOne({ userId: userid }).populate('products.productId')
      const products = cart.products;
      let quantityLess = 0;
      const quancheck = products.forEach((pro) => {
        if (pro.productId.stock <= 0) {
          quantityLess = pro.productId.name;
        }
  
      })
  
      if (quantityLess) {
        res.json({ quan: true, quantityLess })
      } else {
        const user = await User.findOne({ _id: userid })
        const status = payment == 'COD' ? 'placed' : 'pending'
        const address = user.address[index]
        const date = Date.now()
        const order = new Order({
          userId: userid,
          products: products,
          totalAmount: subTotal,
          date: date,
          status: status,
          deliveryAddress: address,
          paymentMethod: payment
        })
        const oderDetails = await order.save()
        const orderId = oderDetails._id;
  
      
        if (oderDetails.status == 'placed') {
          await Cart.deleteOne({ userId: userid })
          for (let i = 0; i < products.length; i++) {
  
            const productId = products[i].productId;
            const productQuantity = products[i].quantity;
            await Product.updateOne({ _id: productId }, { $inc: { stock: -productQuantity } })
          }
          res.json({ success: true, orderId })
  
        }
       
        
  
      }
    } catch (error) {
      console.log(error);
    }
  }
//------------------------------------------------------------------------------------------------------------//
//-----------Load order Sucess---------------------------------------------------------------------------------------//
function generateRandomOrderId() {
 
  const randomNum = Math.floor(Math.random() * 9000) + 10000;
 
  return randomNum;
}

const loadOrderSuccess = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    let orderedProducts = [];
    const randomOrderNumber = generateRandomOrderId(); // Use the function to generate random order ID

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

    res.render('orderSuccess', { orderId, orderedProducts, randomOrderNumber });
  } catch (error) {
    console.log(error.message);
    res.render('orderSuccess', { orderId: null, orderedProducts: [], randomOrderNumber: null });
  }
}
  //------------------------------------------------------------------------------------------//
  //---------------Load order details page---------------------------------------------------------------------------//
 const loadOrderDetilas= async(req,res)=>{
    try {
        const orderId = req.params.id
        console.log(orderId);

        const order = await Order.findById(orderId);
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
          console.log("orderedProducts", orderedProducts);
        }
    
        res.render('orderDetails', { order, orderedProducts});
        
    } catch (error) {
        
    }
 } 
//--------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------//

  module.exports={
    placeOrder,
    loadOrderSuccess,
    loadOrderDetilas
  }