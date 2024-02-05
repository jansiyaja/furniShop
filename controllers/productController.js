const Category = require('../models/categoryModel');
const Product = require('../models/products');
// const cloudinary= require('../config/cloudinary')

const cloudinary = require('cloudinary').v2;


cloudinary.config({
  cloud_name:process.env.CLOUD_NAME,
  api_key:process.env.API_KEYS,
  api_secret:process.env.API_SECRETS
});



//------------------Product page loading--------------------------------------//
const loadProduct = async (req, res) => {
  try {
    let page = 1;
    if (req.query.id) {
      page = req.query.id
    }
    let limit = 9;
    let Next = page + 1;
    let previous = page > 1 ? page - 1 : 1

    let count = await Product.find({}).count()

    let totalPages = Math.ceil(count / limit)
    if (Next > totalPages) {
      Next = totalPages
    }
    const products = await Product.find().populate("category")
      .limit(limit)
      .skip((page - 1) * limit)
      .exec()



    res.render('productList',
      {
        products: products,
        page:page,
              previous:previous,
              next:Next,
              totalPages:totalPages
      })

  } catch (error) {
    console.log(error.message);
  }
}

//------------------------------------------------------------------------------------------//

//------------------Add Product  page-------------------------------------//

const loadaddProduct = async (req, res) => {
  try {
    const categories = await Category.find({})
    res.render('addProducts', { categories })
  } catch (error) {
    console.log(error.message);
  }
}
//------------------------------------------------------------------------------------------//


//-----------------Add the product----------------------------------------------------------------------//

const addProduct = async (req, res) => {
  try {
    const details = req.body;
    const files = req.files;
    let arrimages = [];

    if (Array.isArray(req.files)) {
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(files[i].path, {
          width: 500,
          height: 500,
          crop: 'fill',
         
        });
        arrimages.push(result.secure_url);
      }
    }

    if (details.quantity > 0 && details.price > 0) {
      const product = new Product({
        name: details.name,
        previous_price: details.previous_price,
        price: details.price,
        category: details.category,
        description: details.description,
        stock: details.quantity,
        images: arrimages
      });
      await product.save();
    }

    res.redirect('/admin/addProduct');
  } catch (error) {
    console.log(error);
  }
};
//------------------------------------------------------------------------------------------//

//-----------------List and Unlist the product-------------------------------------------------------------//


const listUnlist = async (req, res) => {
  try {
     const productId = req.body.userid;
     console.log("Received product id:", productId);

     const product = await Product.findOneAndUpdate(
        { _id: productId },
        { $set: { is_Listed: req.body.isListed } },
        { new: true }
     );

     if (!product) {
        console.error("Product not found");
        return res.status(404).json({ error: "Product not found" });
     }

     console.log("Updated product status:", product.is_Listed);

     res.json({ list: product.is_Listed });
  } catch (error) {
     console.error("Error in listUnlist:", error.message);
     res.status(500).json({ error: "Internal Server Error" });
  }
};



//------------------------------------------------------------------------------------------//
//-------------------edit product load--------------------------------------------------------------------//
const editProductLoad = async (req, res) => {
  try {
    const id = req.query.id
    const product = await Product.findOne({ _id: id })
    const categories = await Category.find({})
    res.render('editProduct', { product, categories })
  } catch (error) {
    console.log(error.message);
  }
}

//------------------------------------------------------------------------------------------//

//--------------------Edit product----------------------------------------------------------------------//


const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const newname = req.body.name;
    const newprevious_price = req.body.previous_price;
    const newprice = req.body.price;
    const newquantity = req.body.quantity;
    const newcategory = req.body.category;
    const newdescription = req.body.description;
    const existingData = await Product.findById(id);

    const arrimages = [];
    for (let i = 0; i < req.files.length; i++) {
      const result = await cloudinary.uploader.upload(req.files[i].path, {
        width: 500,
        height: 500,
        crop: 'fill',
        folder: 'productImages'
      });
      arrimages.push(result.secure_url);
    }

    await Product.updateOne(
      { _id: id },
      {
        $set: {
          name: newname,
          previous_price: newprevious_price,
          price: newprice,
          stock: newquantity,
          category: newcategory,
          description: newdescription,
          images: arrimages
        }
      }
    );

    res.redirect('/admin/products');
  } catch (error) {
    console.log(error);
  }
};

//------------------------------------------------------------------------------------------//


//------------------------loading shoap------------------------------------------------------------------//
const loadShop = async (req, res) => {
  let products;
  let category = await Category.find({ isListed: false })
  try {
    let id = req.query.id
    if (req.query.id) {
      products = await Product.find({ category: id }).populate("category")
    } else {
      products = await Product.find({}).populate("category")
    }
    res.render('shop', { products, category })
  } catch (error) {
    console.log(error.message);
  }
}
//------------------------------------------------------------------------------------------//


//----------------------product details page --------------------------------------------------------------------//

const productView = async (req, res) => {
  try {
    const productId = req.query.id;
    const userid = req.session.user;
    const products = [await Product.findById(productId).populate('category')];
    console.log("ppppp",products);
    const viewProduct = await Product.findById({ _id: productId });
    const relatedProduct = await Product.find({
      category: viewProduct.category,
      _id: {
        $ne: viewProduct._id
      }
    });

    if (userid) {
      const existscart = await Cart.findOne({ userId: userid });

      if (existscart) {
        const existsProduct = existscart.products.find((pro) => pro.productId.toString() === productId);

        if (existsProduct) {
          return res.render('productDetails', { products, relatedProduct, inCart: true });
        }
      }
    }

    res.render('productDetails', { products, relatedProduct, inCart: false });
  } catch (error) {
    console.log(error.message);
   
    res.status(500).send('Internal Server Error');
  }
}
//------------------------------------------------------------------------------------------//

module.exports = {
  loadaddProduct,
  loadProduct,
  addProduct,
  listUnlist,
  editProductLoad,
  editProduct,
  
  loadShop,
  productView
}