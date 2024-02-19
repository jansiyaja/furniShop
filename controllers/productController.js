const Category = require('../models/categoryModel');
const Product = require('../models/products');
const Cart= require('../models/cartModel')

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
// const addProduct = async (req, res) => {
//   try {
//     const details = req.body;
//     const files = req.files;
//     let arrImages = [];

//     if (Array.isArray(req.files)) {
//       for (let i = 0; i < req.files.length; i++) {
//         const result = await cloudinary.uploader.upload(files[i].path, {
//           width: 500,
//           height: 500,
//           crop: 'fill',
//         });
//         arrImages.push(result.secure_url);
//       }
//     }

//     if (details.quantity > 0 && details.price > 0) {
//       const variations = []; // Initialize an array to store variations

//       // Loop through variation details provided in the request
//       for (const variationDetails of details.variations) {
//         // For each variation, add it to the variations array
//         variations.push({
//           color: variationDetails.color,
//           size: variationDetails.size,
//           quantity: variationDetails.quantity,
//           // Add any other properties specific to a variation
//         });
//       }

//       // Create the product with variations
//       const product = new Product({
//         name: details.name,
//         previous_price: details.previous_price,
//         price: details.price,
//         category: details.category,
//         description: details.description,
//         stock: details.quantity,
//         images: arrImages,
//         variations: variations, // Assign the array of variations
//       });

//       await product.save();
//     }

//     res.redirect('/admin/addProduct');
//   } catch (error) {
//     console.log(error);
//     res.status(500).send('Internal Server Error');
//   }
// };

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



// const loadShop = async (req, res) => {
//   try {
//     let products;
//     let category = await Category.find({ isListed: false });
//     let id = req.query.id;
//     let priceFilter = req.query.priceFilter; // Added priceFilter parameter

//     let query = {};

//     if (id) {
//       query.category = id;
//     }

//     if (priceFilter === 'highToLow') {
//       products = await Product.find(query).sort({ price: -1 }).populate("category");
//     } else if (priceFilter === 'lowToHigh') {
//       products = await Product.find(query).sort({ price: 1 }).populate("category");
//     } else {
//       products = await Product.find(query).populate("category");
//     }

//     const messages = req.flash('error');

//     res.render('shop', { products, category, messages });
//   } catch (error) {
//     console.log(error.message);
//   }
// };
const loadShop = async (req, res) => {
  try {
    const itemsPerPage = 10; // Set the number of items to display per page

    let products;
    let category = await Category.find({ isListed: false });
    let id = req.query.id;
    let priceFilter = req.query.priceFilter;
    let page = req.query.page || 1; // Get the page from the query parameters

    let query = {};

    if (id) {
      query.category = id;
    }

    if (priceFilter === 'highToLow') {
      products = await Product.find(query)
        .sort({ price: -1 })
        .skip((page - 1) * itemsPerPage) // Skip items based on the current page
        .limit(itemsPerPage); // Limit the number of items per page
    } else if (priceFilter === 'lowToHigh') {
      products = await Product.find(query)
        .sort({ price: 1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    } else {
      products = await Product.find(query)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    }

    const totalProducts = await Product.countDocuments(query); // Get the total number of products for pagination
    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    const messages = req.flash('error');

    res.render('shop', {
      products,
      category,
      messages,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//------------------------------------------------------------------------------------------//


//----------------------product details page --------------------------------------------------------------------//

const productView = async (req, res) => {
  try {
    const productId = req.query.id;
    const products = [await Product.findById(productId)];
    res.render('productDetails', { products, inCart: false });
  } catch (error) {
    console.log("cart",error.message);
   
    res.status(500).send('Internal Server Error');
  }
}
// const productView = async (req, res) => {
//   try {
//     const productId = req.query.id;
//     const userid = req.session.user;
    
// const products = await Product.findById(productId).populate('category');

// const existscart = await Cart.findOne({ userId: userid });
// console.log(existscart);

// // Add more console.log statements to identify the flow of your program

// if (userid) {
//   if (existscart) {
//     const existsProduct = existscart.products.find((pro) => pro.productId.toString() === productId);

//     if (existsProduct) {
//       console.log('In existsProduct block');
//       return res.render('productDetails', { products,  inCart: true });
//     }
//   }
// }

// console.log('Before render');
// res.render('productDetails', { products,inCart: false });


//   } catch (error) {
//     console.log(error.message);
//     res.render('errorPage', { errorMessage: 'An error occurred while loading the product details.' });
//   }
// }

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