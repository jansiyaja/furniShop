const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const Order = require('../models/orderModel')

const Product = require('../models/products');


//------------------placing the order-------------------------------------------------------//
// const placeOrder = async (req, res) => {
//   try {
//       const {
//         index,
//         payment,
//         subTotal
//       } = req.body;
//       const userid = req.session.user.id;
// const cart = await Cart.findOne({ userId: userid }).populate('products.productId')
//       const products = cart.products;

//       const quantityLess = products
//           .map((pro) => (pro.productId.stock <= 0 ? pro.productId.name : null))
//           .filter((name) => name);

//       if (quantityLess.length > 0) {
//           return res.json({ quan: true, quantityLess });
//       }

//       const user = await User.findOne({ _id: userId });
//       const status = payment === 'COD' ? 'placed' : 'pending';
//       const address = user.address[index];
//       const date = Date.now();

//       const order = new Order({
//           userId: userId,
//           products,
//           totalAmount: subTotal,
//           date,
//           status,
//           deliveryAddress: address,
//           paymentMethod: payment
//       });

//       const orderDetails = await order.save();
//       const orderId = orderDetails._id;
//       console.log("ooooo",orderId);

//       if (orderDetails.status === 'placed') {
//           await Cart.deleteOne({ userId });

//           const bulkWriteOperations = products.map(({ productId, quantity }) => ({
//               updateOne: {
//                   filter: { _id: productId },
//                   update: { $inc: { stock: -quantity } }
//               }
//           }));

//           await Product.bulkWrite(bulkWriteOperations);
// console.log(bulkWriteOperations);
//           return res.json({ success: true, orderId });
//       }
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal Server Error' });
//   }
// };
const placeOrder = async (req, res) => {
  try {
      console.log("Request received at /placeOrder");
      const { index, payment, subTotal } = req.body;
      const userId = req.session.user.id;
      console.log("uswer",userId);

      // Populate user's cart with product details
      const cart = await Cart.findOne({ userId }).populate('products.productId');
      const products = cart.products;

      // Check for products with insufficient stock
      const quantityLessProduct = products.find(pro => pro.productId.stock <= 0);

      if (quantityLessProduct) {
          console.log("Quantity less:", quantityLessProduct.productId.name);
          return res.json({ quan: true, quantityLess: quantityLessProduct.productId.name });
      }else{
        console.log("No quantity less products");
      }

      // If all products have sufficient stock, proceed with order placement
      const user = await User.findOne({ _id: userId });
      const status = payment === 'COD' ? 'placed' : 'pending';
     // console.log(status);
      const address = user.address[index];
     // console.log(address);
      const date = Date.now();

      const order = new Order({
          userId: userId,
          products: products,
          totalAmount: subTotal,
          date: date,
          status: status,
          deliveryAddress: address,
          paymentMethod: payment
      });

      const orderDetails = await order.save();
      console.log(orderDetails);
      const orderId = orderDetails._id;
      console.log(orderId);
      
      // Check status for each product
      const allProductsPlaced = orderDetails.products.every(product => product.status === 'placed');
      
      if (allProductsPlaced) {
          await Cart.deleteOne({ userId });
      
          for (const product of products) {
              await Product.updateOne(
                  { _id: product.productId._id },
                  { $inc: { stock: -product.quantity } }
              );
          }
      
          console.log("Order placed successfully. Order ID:", orderId);
          return res.json({ success: true, orderId });
      } else {
          console.log("Not all products are placed");
      }
      
     
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
};
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
    const randomOrderNumber = generateRandomOrderId(); 
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
  const loadOrderDetilas = async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log(orderId);

        const order = await Order.findById(orderId);
        // console.log("order", order);
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
                  console.log(orderedProducts);
            res.render('orderDetails', { order, orderedProducts });
        }
    } catch (error) {
        // Handle errors, you might want to send an error response or render an error page
        console.error(error);
        res.status(500).render('error', { error });
    }
};



//--------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------//

  module.exports={
    placeOrder,
    loadOrderSuccess,
    loadOrderDetilas
  }