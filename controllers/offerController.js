const Offer= require('../models/offerModel');
const Category= require('../models/categoryModel')
const Product= require('../models/products')
  //-------------------------------------------------------------------------------//
  const loadOffer = async (req, res) => {
    try {
      let page = 1;
      if (req.query.id) {
        page = req.query.id;
      }
  
      let limit = 6;
      let next = page + 1;
      let previous = page > 1 ? page - 1 : 1;
  
      const count = await Offer.countDocuments();
      let totalPages = Math.ceil(count / limit);
  
      if (next > totalPages) {
        next = totalPages;
      }
  
      const offer = await Offer.find()
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();
  
      res.render('offers', {
        offer: offer,
        page: page,
        previous: previous,
        next: next,
        totalPages: totalPages,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  //-------------------------------------------------------------------------------//

//-------loading the add  offer Page-----------------------------------------------------//
const loadaddOffer = async (req, res) => {
    try {
      res.render('addOffer')
    } catch (error) {
      console.log(error.message);
    }
  }
  
  //-------------------------------------------------------------------------------//
  //-------Add Offer -----------------------------------------------------------------------//
  const addOffer = async (req, res,) => {
    try {
      let { name, offerPercentage,startingDate,expiryDate } = req.body;
      console.log(req.body);
      const existOffer = await Offer.findOne({ offerPercentage: offerPercentage });
  
      if (existOffer) {
       
        return res.render('addOffer', { message: "Already exists a Offer with this percentage" });
      }
      
  
      const offer = new Offer({
        name: req.body.name,
        offerPercentage: req.body.offerPercentage,
       startingDate: req.body.startingDate,
       expiryDate: req.body.expiryDate,
        isListed: false
      });
  
      await offer.save();
     
      // Redirect to the correct URL after successful category insertion
      res.redirect('/admin/Offer');
    } catch (error) {
      console.error('Error inserting category:', error);
      return res.redirect('/admin/error');
    }
  };
  //-------------------------------------------------------------------------------//
  //---Load Edit Offer----------------------------------------------------------------------------//
  const loadEditOffer= async (req,res)=>{
   
    try {
      const id = req.query.id;
      const offer = await Offer.findOne({_id:id})
      console.log(offer);
      res.render('editOffer',{offer:offer})
    } catch (error) {
      console.log(error.message);
    }
  }
  //-------------------------------------------------------------------------------//
  //------edit Offer-------------------------------------------------------------------------//
  const editOffer = async (req, res) => {
    
    try {
     
      let { name, offerPercentage,startingDate,expiryDate,editid } = req.body;
      console.log(req.body);
      const id= req.body.editid;
  
  
        const already = await Offer .findOne({ _id: { $ne: id }, name: name });
        console.log("already",already);
      if (already) {
        req.flash('error', 'This name is already exist');
        res.redirect('/admin/Offer');

      } else {
        await Offer.findByIdAndUpdate(id, { $set:
             { 
              name: req.body.name,
              offerPercentage:offerPercentage,
             startingDate: startingDate,
             expiryDate: expiryDate,

              

             } });
        
             res.redirect('/admin/Offer');  
      }
     
    } catch (error) {
      console.log(error.message);
      res.redirect('/admin/error');
    }
  }
  
  //-------------------------------------------------------------------------------//
  //---Listing and unlisting  offer----------------------------------------------------------------------------//
  const listOffer = async (req, res) => {
    try {
        const offerId = req.body.id;
        console.log("id", offerId);
        const OfferData = await Offer.findOne({ _id: offerId });

        if (OfferData.isListed === true) {
            await Offer.findByIdAndUpdate({ _id: offerId }, { $set: { isListed: false } });
        } else {
            await Offer.findByIdAndUpdate({ _id: offerId }, { $set: { isListed: true } });
        }

        const updatedOfferData = await Offer.findOne({ _id: offerId });
        res.json({ newListStatus: updatedOfferData.isListed });
    } catch (error) {
        console.log(error.message);
       res.redirect('/admin/error');
    }
};
  //-------------------------------------------------------------------------------//
  //-------Load Apply Offer-for product-------------------------------------------------------------------------//
  const loadProductApplyOffer= async (req, res) => {
    try {
        const productid = req.query.id;
        const productId = await Product.findById(productid);
        const offers = await Offer.find();
        const currentDate = new Date();

       
        const validOffers = offers.filter(offer => currentDate <= new Date(offer.expiryDate));

       
        res.render('productApplyOffer', { offers: validOffers, productId });
    } catch (error) {
        
        console.error(error);
        res.redirect('/admin/error')
    }
}
  //-------------------------------------------------------------------------------//

  //----Load Apply Offer---------------------------------------------------------------------------//
  const loadCategoryApplyOffer = async (req, res) => {
    try {
        const categoryid = req.query.id;
        const categoryId = await Category.findById(categoryid);
        const offers = await Offer.find();
        const currentDate = new Date();

       
        const validOffers = offers.filter(offer => currentDate <= new Date(offer.expiryDate));

       
        res.render('categoryApplyoffer', { offers: validOffers, categoryId });
    } catch (error) {
        
        console.error(error);
        res.redirect('/admin/error')
    }
}


  //-------------------------------------------------------------------------------//
  //----Apply category Offer---------------------------------------------------------------------------//
const categoryApplyOffer=async(req,res)=>{
  try {
    const {offerId,categoryId} = req.body;
    console.log(req.body);
    const offer=await Offer.find({_id:offerId})
    
   
      await Category.findByIdAndUpdate(
        {_id:categoryId},
        {
          $set:{
            offer:offerId
          }
        }
      )
    
      res.json({success:true,})
    
    } catch (error) {
    console.log(error);
  }
}
  //-------------------------------------------------------------------------------//
  //-------------------------------------------------------------------------------//
  const categoryRemoveOffer= async(req,res)=>{
    try {
      const {offerId,categoryId} = req.body;

      await Category.findByIdAndUpdate(
        {_id:categoryId},
        {
          $unset:{
            offer:""
          }
        }
      )
    
      res.json({success:true})
    } catch (error) {
      console.log(error)
    }
  }
  //-------------------------------------------------------------------------------//
  //----Apply category Offer---------------------------------------------------------------------------//
  const productApplyOffer=async(req,res)=>{
    try {
      const {offerId,productId} = req.body;
      console.log(req.body);
      const offer=await Offer.find({_id:offerId})
      
     
        await Product.findByIdAndUpdate(
          {_id:productId},
          {
            $set:{
              offer:offerId
            }
          }
        )
      
        res.json({success:true,})
      
      } catch (error) {
      console.log(error);
    }
  }
    //-------------------------------------------------------------------------------//
    //-------------------------------------------------------------------------------//
    const productRemoveOffer= async(req,res)=>{
      try {
        const {offerId,productId} = req.body;
  
        await Product.findByIdAndUpdate(
          {_id:productId},
          {
            $unset:{
              offer:""
            }
          }
        )
      
        res.json({success:true})
      } catch (error) {
        console.log(error)
      }
    }
    //-------------------------------------------------------------------------------//
  module.exports={
    loadOffer,
   loadaddOffer ,
   addOffer,
   loadEditOffer,
   editOffer,
   listOffer,
   loadCategoryApplyOffer,
categoryApplyOffer,
categoryRemoveOffer,
loadProductApplyOffer,
productApplyOffer,
productRemoveOffer
  }
  
  
