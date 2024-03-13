const Category = require('../models/categoryModel')


//--------loading the caterory listing pages-------------------------------//
const loadCategory = async (req, res) => {
  try {
    let page = 1;
    if (req.query.id) {
      page = req.query.id;
    }

    let limit = 6;
    let next = page + 1;
    let previous = page > 1 ? page - 1 : 1;

    const count = await Category.countDocuments();
    let totalPages = Math.ceil(count / limit);

    if (next > totalPages) {
      next = totalPages;
    }

    const categories = await Category.find()
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    res.render('category', {
      category: categories,
      page: page,
      previous: previous,
      next: next,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------------------------------------------//

//loading the add category pages-----------------------------------------------------//
const loadaddCategory = async (req, res) => {
  try {
    res.render('addCategory')
  } catch (error) {
    console.log(error.message);
  }
}

//-------------------------------------------------------------------------------//


//-------------------insert category------------------------------------------------------------//

const insertCategory = async (req, res) => {
  try {
    let { name, description } = req.body;
    console.log(req.body);
    const existCategory = await Category.findOne({ name: name });

    if (existCategory) {
     
      return res.render('addategory', { message: "Already exists a category with this name" });
    }
    

    const category = new Category({
      name: req.body.name,
      description: req.body.description,
      isListed: false
    });

    await category.save();
   
    // Redirect to the correct URL after successful category insertion
    res.redirect('/admin/category');
  } catch (error) {
    console.error('Error inserting category:', error);
    return res.redirect('/admin/error');
  }
};
//-------------------------------------------------------------------------------//

//-------listing and unlisting the category---------------------------------//
const listCategory = async (req, res) => {
  try {

    const categoryid = req.body.id
    const CategoryData = await Category.findOne({ _id: categoryid })
    if (CategoryData.isListed === true) {

      await Category.findByIdAndUpdate({ _id: categoryid }, { $set: { isListed: false } })
    } else {

      await Category.findByIdAndUpdate({ _id: categoryid }, { $set: { isListed: true } })
    }
    res.json({ list: true })
  } catch (error) {
    console.log(error.message);
  }
}

//-------------------------------------------------------------------------------------//

//------- Loading the Edit the category----------------------------------------------------------//

const LoadEditCategory = async (req, res) => {
  try {
    console.log("'catgeorrroyy");
    const categoryId = req.query.id;
    const categoryEdit = await Category.findOne({ _id: categoryId });
    console.log(categoryEdit,"categoryEdit");
    
    if (!categoryEdit) {
     
      return res.redirect('/admin/error');
    }
   
  
    res.render('editCategory', { categoryEdit });
  } catch (error) {
    console.log(error);
    return res.redirect('/admin/error');
  }
}
//-------------------------------------------------------------------------------------//

//------- Edit the category----------------------------------------------------------//
const editCategory = async (req, res) => {
  try {
    
    const id= req.body.editid
    const newname = req.body.editname;
    const newdescription = req.body.editdisc;

 
    if (!id) {
      req.flash('error', 'Invalid category ID');
      res.redirect('/admin/category');
      return;
    }

    const already = await Category.findOne({ _id: { $ne: id }, name: newname });

    if (already) {
      req.flash('error', "Already exists a category with this name");
      console.log(req.flash('error')); 
      res.redirect(`/admin/editCategory?id=${id}`);
    } else {
      await Category.findByIdAndUpdate(id, { $set: { name: newname, description: newdescription } });
      req.flash('success', "updated successFullt");
      res.redirect('/admin/category');
    }
  } catch (error) {
    console.log(error.message);
    // res.status(500).send('Internal Server Error');
  }
}

//---------------------------------------------------------------------------------------//





module.exports = {
  loadaddCategory,
  loadCategory,
  insertCategory,
  listCategory,
  LoadEditCategory,
  editCategory
 }