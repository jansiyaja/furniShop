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
    let limit = 8;
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


// const editProduct = async (req, res) => {
//   try {
//     const id = req.query.id;
//     const newname = req.body.name;
//     const newprevious_price = req.body.previous_price;
//     const newprice = req.body.price;
//     const newquantity = req.body.quantity;
//     const newcategory = req.body.category;
//     const newdescription = req.body.description;
    

//     const arrimages = [];
//     for (let i = 0; i < req.files.length; i++) {
//       const result = await cloudinary.uploader.upload(req.files[i].path, {
//         width: 500,
//         height: 500,
//         crop: 'fill',
//         folder: 'productImages'
//       });
//       arrimages.push(result.secure_url);
//     }

//     await Product.updateOne(
//       { _id: id },
//       {
//         $set: {
//           name: newname,
//           previous_price: newprevious_price,
//           price: newprice,
//           stock: newquantity,
//           category: newcategory,
//           description: newdescription,
//           images: arrimages
//         }
//       }
//     );

//     res.redirect('/admin/products');
//   } catch (error) {
//     console.log(error);
//   }
// };

const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const newname = req.body.name;
    const newprevious_price = req.body.previous_price;
    const newprice = req.body.price;
    const newquantity = req.body.quantity;
    const newcategory = req.body.category;
    const newdescription = req.body.description;

    const existingProduct = await Product.findById(id);

    // Handle existing images
    const existingImages = existingProduct.images || [];
    const arrimages = [...existingImages];

    // Handle new images
    for (let i = 0; i < req.files.length; i++) {
      const result = await cloudinary.uploader.upload(req.files[i].path, {
        width: 500,
        height: 500,
        crop: 'fill',
        folder: 'productImages'
      });

      // Check if the new image URL is different from the existing ones
      if (!arrimages.includes(result.secure_url)) {
        arrimages.push(result.secure_url);
      }
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
//     const itemsPerPage = 8; 
//     let products;
//     let category = await Category.find({ isListed: false });
//     let id = req.query.id;
//     let priceFilter = req.query.priceFilter;
//     let page = req.query.page || 1; 

//     let query = {};

//     if (id) {
//       query.category = id;
//     }

   
//     if (req.query.search) {
      
//       query.name = { $regex: new RegExp(req.query.search, 'i') };
//     }

//     if (priceFilter === 'highToLow') {
//       products = await Product.find(query)
//         .sort({ price: -1 })
//         .skip((page - 1) * itemsPerPage) 
//         .limit(itemsPerPage); 
//     } else if (priceFilter === 'lowToHigh') {
//       products = await Product.find(query)
//         .sort({ price: 1 })
//         .skip((page - 1) * itemsPerPage)
//         .limit(itemsPerPage);
//     } else {
//       products = await Product.find(query)
//         .skip((page - 1) * itemsPerPage)
//         .limit(itemsPerPage);
//     }

//     const totalProducts = await Product.countDocuments(query); 
//     const totalPages = Math.ceil(totalProducts / itemsPerPage);

//     const messages = req.flash('error');

//     res.render('shop', {
//       products,
//       category,
//       messages,
//       currentPage: parseInt(page),
//       totalPages,
//     });
//   } catch (error) {
//     console.log(error.message);
//   }
// };
const loadShop = async (req, res) => {
  try {
   
    const itemsPerPage = 8;
    let products;
    let category = await Category.find({ isListed: false });
    let id = req.query.id;
    let priceFilter = req.query.priceFilter;
    let page = req.query.page || 1;

    let query = {};

    if (id) {
      query.category = id;
    }

    if (req.query.search) {
      query.name = { $regex: new RegExp(req.query.search, 'i') };
    }

   
      // Apply price filter only if there is an 'id' in the request
      if (priceFilter === 'highToLow') {
        products = await Product.find(query)
            .sort({ price: -1 })
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);
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
    // } else {
    //   // If there is no 'id', retrieve products without applying the price filter
    //   products = await Product.find(query)
    //     .skip((page - 1) * itemsPerPage)
    //     .limit(itemsPerPage);
    // }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    const messages = req.flash('error');

    res.render('shop', {
      products,
      category,
      user: req.session.user,
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
    res.render('productDetails', { products, inCart: false ,user: req.session.user});
  } catch (error) {
    console.log("cart",error.message);
   
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