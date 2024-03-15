const Offer= require('../models/offerModel');

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
  
      res.render('Offers', {
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

  module.exports={
    loadOffer,

    loadaddOffer ,addOffer
  }