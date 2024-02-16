const User= require('../models/userModel');
const Product= require('../models/products');
const Cart=require('../models/cartModel');
const Wishlist=require('../models/wishlistModel')

//------------cart Loading------------------------------------------//
const loadCart = async (req, res) => {
    try {
      if (req.session.user) {
       
        const userId = req.session.user.id;
        
       const cartDetails = await Cart.findOne({ userId: userId }).populate({ path: 'products.productId' }).exec();
        
      
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
const addToCart = async (req, res) => {
    try {
        console.log("Session user:", req.session.user);
        if (!req.session.user || !req.session.user.id) {
            return res.json({ login: true, message: 'Please login and continue shopping.' });
        } else {
            const userid = req.session.user.id;
            console.log(userid);
            const { productQuantity, productId } = req.body;
            const product = await Product.findById(productId);
            const cart = await Cart.findOne({ userId: userid });

            if (cart) {
                const existProduct = cart.products.find((pro) => pro.productId == productId);
                if (existProduct) {
                    await Cart.findOneAndUpdate(
                        { userId: userid, "products.productId": productId },
                        { $inc: { "products.$.quantity": productQuantity, "products.$.totalPrice": productQuantity * product.price } }
                    );
                } else {
                    await Cart.findOneAndUpdate(
                        { userId: userid },
                        {
                            $push: {
                                products: {
                                    productId: productId,
                                    quantity: productQuantity,
                                    totalPrice: productQuantity * product.price
                                }
                            }
                        }
                    );
                }
            } else {
                const newCart = new Cart({
                    userId: userid,
                    products: [
                        {
                            productId: productId,
                            quantity: productQuantity,
                            totalPrice: productQuantity * product.price
                        }
                    ]
                });
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
        const product = await Product.findOne({ _id: productId });
        const userid = req.session.user.id;
        const cart = await Cart.findOne({ userId: userid });

        if (!cart || !cart.products) {
            return res.status(404).json({ error: 'Cart not found or empty.' });
        }

        const productInCart = cart.products.find((p) => p.productId == productId);

        if (!productInCart) {
            return res.status(404).json({ error: 'Product not found in the cart.' });
        }

        const currentQuantity = productInCart.quantity;

        if (count === -1 && currentQuantity <= 1) {
            return res.json({ min: true });
        }

        if (count === 1 && currentQuantity >= product.stock) {
            return res.json({ max: true });
        }

        const productPrice = product.price;

        await Cart.updateOne(
            { userId: userid, 'products.productId': productId },
            {
                $inc: {
                    'products.$.quantity': count,
                    'products.$.totalPrice': count * productPrice
                }
            }
        );

        return res.json({
            success: true,
            newQuantity: productInCart.quantity,
            newTotalPrice: productInCart.totalPrice,
           
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
      if (!req.session.user || !req.session.user.id) {
        return res.json({ login: true, message: 'please login' })
      } else {
  
        const userId = req.session.user.id;
        console.log(req.body);
        const { productId } = req.body;
        console.log(productId);
        const already = await Wishlist.findOne({ productId: productId })
        if (already) {
          res.json({ already: true })
        } else {
          const whishlist = new Wishlist({
            userId: userId,
            productId: productId
          })
          await whishlist.save()
          res.json({ added: true })
        }
      }
  
    } catch (error) {
      console.log(error.message);
    }
  }
//-----------------------------------------------------------------//
//--------------Remove wishlist---------------------------------------------------//
const removeWishlist = async (req, res) => {
    try {
      const userId = req.session.user.id
      const {productId} = req.body;
      console.log(req.body);
      const remove = await Wishlist.findOneAndDelete({productId:productId})
      console.log(remove);
      res.json({removed:true})
    } catch (error) {
      console.log(error.message);
    }
  }
//-----------------------------------------------------------------//

module.exports={
    loadCart,
    addToCart,
   updateQuantity,
   removeCart,
//------wishlist-------//
   loadWhislist,
   addToWishlist,
   removeWishlist
}