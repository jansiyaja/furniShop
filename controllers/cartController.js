const User= require('../models/userModel');
const Product= require('../models/products');
const Cart=require('../models/cartModel');
const Wishlist=require('../models/wishlistModel')
const Category= require('../models/categoryModel')
const offer= require('../models/offerModel')
//------------cart Loading------------------------------------------//
const loadCart = async (req, res) => {
    try {
      if (req.session.user) {
       
        const userId = req.session.user.id;
        
        const cartDetails = await Cart.findOne({ userId: userId }).populate({
          path: 'products.productId',
          populate: [
              { path: 'offer' }, 
              { path: 'category', populate: { path: 'offer' } } 
          ]
      }).exec();
      
       
      console.log(cartDetails);
        res.render('cart', { cartDetails: cartDetails, user: req.session.user });
      } else {
        req.flash('error', 'You are not verified. Please <a href="/login">login</a>.');
        res.redirect('/shop');
      }
    } catch (error) {
      console.error(error);
    }
  };
  
//-----------------------------------------------------------------//


//--------------Add to cart---------------------------------------------------//
// const addToCart = async (req, res) => {
//     try {
//         console.log("Session user:", req.session.user);
//         if (!req.session.user || !req.session.user.id) {
//             return res.json({ login: true, message: 'Please login and continue shopping.' });
//         } else {
//             const userid = req.session.user.id;
//             console.log(userid);
//             const { productQuantity, productId } = req.body;
//             const product = await Product.findById(productId);
//             const cart = await Cart.findOne({ userId: userid });

//             if (cart) {
//                 const existProduct = cart.products.find((pro) => pro.productId == productId);
//                 if (existProduct) {
//                     await Cart.findOneAndUpdate(
//                         { userId: userid, "products.productId": productId },
//                         { $inc: { "products.$.quantity": productQuantity, "products.$.totalPrice": productQuantity * product.price } }
//                     );
//                 } else {
//                     await Cart.findOneAndUpdate(
//                         { userId: userid },
//                         {
//                             $push: {
//                                 products: {
//                                     productId: productId,
//                                     quantity: productQuantity,
//                                     totalPrice: productQuantity * product.price
//                                 }
//                             }
//                         }
//                     );
//                 }
//             } else {
//                 const newCart = new Cart({
//                     userId: userid,
//                     products: [
//                         {
//                             productId: productId,
//                             quantity: productQuantity,
//                             totalPrice: productQuantity * product.price
//                         }
//                     ]
//                 });
//                 await newCart.save();
//             }

//             res.json({ success: true });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };
// const addToCart = async (req, res) => {
//   try {
//       //console.log("Session user:", req.session.user);
//       if (!req.session.user || !req.session.user.id) {
//           return res.json({ login: true, message: 'Please login and continue shopping.' });
//       } else {
//           const userid = req.session.user.id;
//          // console.log(userid);
//           const { productQuantity, productId } = req.body;
//           let product = await Product.findById(productId) .populate('offer')
//           .populate({
//             path: 'category',
//             populate: {
//               path: 'offer', 
//               model: 'Offer' 
//             }
//          })
//          .exec();
//           const cart = await Cart.findOne({ userId: userid });

//           // Check for product and category offers
//           console.log(product.offer);
//           let discountedPrice = product.price;
        
//          if (product.offer) {
  
//         const productDiscount = (product.offer.offerPercentage * product.price) / 100;
 
//   discountedPrice -= productDiscount;
//   console.log("in the product");
// } else {
 
//   const category = await Category.findById(product.category._id).populate('offer');
//   console.log("cat products",category.offer);
//   if (category && category.offer) {
      
//       const categoryDiscount = (category.offer.offerPercentage * product.price) / 100;
     
//       discountedPrice -= categoryDiscount;
//       console.log("in the category");
//   }
// }


//           if (cart) {
//               const existProduct = cart.products.find((pro) => pro.productId == productId);
//               if (existProduct) {
//                   await Cart.findOneAndUpdate(
//                       { userId: userid, "products.productId": productId },
//                       { $inc: { "products.$.quantity": productQuantity, "products.$.totalPrice": productQuantity * discountedPrice } }
//                   );
//               } else {
//                   await Cart.findOneAndUpdate(
//                       { userId: userid },
//                       {
//                           $push: {
//                               products: {
//                                   productId: productId,
//                                   quantity: productQuantity,
//                                   totalPrice: productQuantity * discountedPrice
//                               }
//                           }
//                       }
//                   );
//               }
//           } else {
//               const newCart = new Cart({
//                   userId: userid,
//                   products: [
//                       {
//                           productId: productId,
//                           quantity: productQuantity,
//                           totalPrice: productQuantity * discountedPrice
//                       }
//                   ]
//               });
//               await newCart.save();
//           }

//           res.json({ success: true });
//       }
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal Server Error' });
//   }
// };
const addToCart = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.json({ login: true, message: 'Please login and continue shopping.' });
    } else {
      const userId = req.session.user.id;
      const { productQuantity, productId } = req.body;

      let product = await Product.findById(productId).populate('offer').populate({ path: 'category', populate: { path: 'offer', model: 'Offer' } }).exec();
      
      let discountedPrice = product.price;

      if (product.offer) {
        const productDiscount = (product.offer.offerPercentage * product.price) / 100;
        discountedPrice -= productDiscount;
      } else {
        const category = await Category.findById(product.category._id).populate('offer');
        if (category && category.offer) {
          const categoryDiscount = (category.offer.offerPercentage * product.price) / 100;
          discountedPrice -= categoryDiscount;
        }
      }

      const cart = await Cart.findOne({ userId: userId });

      if (cart) {
        const existProduct = cart.products.find((pro) => pro.productId == productId);
        if (existProduct) {
          await Cart.findOneAndUpdate({ userId: userId, "products.productId": productId }, { $inc: { "products.$.quantity": productQuantity } });
        } else {
          await Cart.findOneAndUpdate({ userId: userId }, { $push: { products: { productId: productId, quantity: productQuantity } } });
        }
      } else {
        const newCart = new Cart({ userId: userId, products: [{ productId: productId, quantity: productQuantity }] });
        await newCart.save();
      }

      res.json({ success: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


//-----------------------------------------------------------------//
//-----------------------------------------------------------------//


const updateQuantity = async (req, res) => {
  try {
      const { productId, count } = req.body;
      const product = await Product.findById(productId).populate('offer')
          .populate({
              path: 'category',
              populate: {
                  path: 'offer',
                  model: 'Offer'
              }
          })
          .exec();

      if (!product) {
          return res.status(404).json({ error: 'Product not found.' });
      }

      const userid = req.session.user.id;
     const cart = await Cart.findOne({ userId: userid }); 

      if (!cart || !cart.products) {
          return res.status(404).json({ error: 'Cart not found or empty.' });
      }

      const productInCartIndex = cart.products.findIndex((p) => p.productId == productId);

      if (productInCartIndex === -1) {
          return res.status(404).json({ error: 'Product not found in the cart.' });
      }

      const currentQuantity = cart.products[productInCartIndex].quantity;

      if (count === -1 && currentQuantity <= 1) {
          return res.json({ min: true });
      }

      if (count === 1 && currentQuantity >= product.stock) {
          return res.json({ max: true });
      }

      let discountedPrice = product.price;
      if (product.offer) {
          discountedPrice -= product.offer.offerPercentage * product.price / 100;
      } else if (product.category && product.category.offer) {
          discountedPrice -= product.category.offer.offerPercentage * product.price / 100;
      }

      const newQuantity = currentQuantity + count;
      const newTotalPrice = discountedPrice * newQuantity;
      console.log("newTotalPrice",newTotalPrice);

      cart.products[productInCartIndex].quantity = newQuantity;
    
      await cart.save();

      return res.json({
          success: true,
          newQuantity,
          newTotalPrice,
      });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
};


//-----------------------------------------------------------------//
//---------------------Remove cart--------------------------------------------//
const removeCart = async (req, res) => {
    try {
      const userId = req.session.user.id
      const productId = req.body.product
      const userCart = await Cart.findOne({ userId: userId })
      if (userCart) {
        await Cart.findOneAndUpdate(
          {
            userId: userId
          }, {
          $pull: { products: { productId: productId } }
        }
        )
      }
      res.json({ success: true })
    } catch (error) {
      console.log(error.message);
    }
  }
//-----------------------------------------------------------------//
//----------------Load wishlist-------------------------------------------------//
const loadWhislist = async (req, res) => {
    try {
      if (req.session.user) {
        const userId = req.session.user.id;
        
        // Assuming you have a field named `productId` in your Wishlist model
        const wishlistDetails = await Wishlist.find({ userId: userId }).populate('productId');
        
        console.log(wishlistDetails);
      
        res.render('wishlist', { wishlistDetails: wishlistDetails , user: req.session.user});
      } else {
        req.flash('error', 'You are not verified. Please <a href="/login">login</a>.');
        res.redirect('/shop');
      }
    } catch (error) {
      console.error(error);
    }
  };
  
//-----------------------------------------------------------------//
//-------------------Add to wishlist----------------------------------------------//

const addToWishlist = async (req, res) => {
  try {
    const userId= req.session.user.id
     const { productId } = req.body; 
     
     let wishlist = await wishlistProduct.findOne({ userId: userId });
 
  
     if (!wishlist) {
       wishlist = new wishlistProduct({ userId: userId, productId: [] });
       await wishlist.save();
     }
 
     // Check if the product is already in the wishlist
     const productExists = wishlist.productId.some(id => id.equals(productId));
 
     // If the product is not in the wishlist, add it
     if (!productExists) {
       wishlist.productId.push(productId);
       await wishlist.save();
       res.json({ added: true });
     } else {
       
       res.json({ added: false, message: "Product already in wishlist" });
     }
  } catch (error) {
     console.log(error.message);
     res.status(500).json({ error: "An error occurred while processing your request" });
  }
 };
 
//-----------------------------------------------------------------//
//--------------Remove wishlist---------------------------------------------------//
const removeWishlist = async (req, res) => {
  try {
      const userId = req.session.user.id;
      const {_id} = req.body;
console.log(_id);
      // Assuming productId is an array of arrays in your Wishlist model
      const remove = await Wishlist.findOneAndDelete({ userId: userId, _id: _id });

      console.log(remove);
      res.json({ removed: true, });
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


//-----------------------------------------------------------------//
//--------------Wishlist To Cart---------------------------------------------------//
const wishToCart = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.json({ login: true, message: 'Please login and continue shopping.' });
    }

    const userId = req.session.user.id;
    const wishlist = await Wishlist.findOne({ userId: userId });

    if (wishlist && wishlist.productId.length > 0) {
      const cart = await Cart.findOne({ userId: userId });

      if (cart) {
        for (const productId of wishlist.productId) {
          const existingProduct = cart.products.find((pro) => pro.productId.toString() === productId.toString());

          if (!existingProduct) {
            cart.products.push({
              productId: productId,
              // You can add other properties like quantity if needed
            });
          }
        }

        await cart.save();
      } else {
        const newCart = new Cart({
          userId: userId,
          products: wishlist.productId.map((productId) => ({
            productId: productId,
            // You can add other properties like quantity if needed
          })),
        });

        await newCart.save();
      }

      // Clear the wishlist after adding to the cart
      await Wishlist.findOneAndDelete({ userId: userId });

      res.json({ success: true, message: 'Wishlist items added to the cart successfully.' });
    } else {
      res.json({ success: false, message: 'Wishlist is empty.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


//-----------------------------------------------------------------//

module.exports={
    loadCart,
    addToCart,
   updateQuantity,
   removeCart,
//------wishlist-------//
   loadWhislist,
   addToWishlist,
   removeWishlist,
   wishToCart
}