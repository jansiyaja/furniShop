const Coupon=require('../models/couponModel');


//-----------LoadIng Coupon Dashboard----------------------------------------------------------------------//
const loadCoupon = async (req, res) => {
    try {
      let page = 1;
      if (req.query.id) {
        page = req.query.id;
      }
  
      let limit = 6;
      let next = page + 1;
      let previous = page > 1 ? page - 1 : 1;
  
      const count = await Coupon.countDocuments();
      let totalPages = Math.ceil(count / limit);
  
      if (next > totalPages) {
        next = totalPages;
      }
  
      const coupons = await Coupon.find()
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();
  
      res.render('coupon', {
        coupons: coupons,
        page: page,
        previous: previous,
        next: next,
        totalPages: totalPages,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

//---------------------------------------------------------------------------------//

//----------Adding the Coupon-----------------------------------------------------------------------//
const LoadAddCoupon= async(req,res)=>{
    try {
        res.render('addCoupon')
    } catch (error) {
      console.log(error);  
    }
}


//---------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------/
const addCoupon = async(req,res)=>{
    try {
        console.log(req.body);
        const{couponName,
        code,
        discount,
        startingDate,
        expairyDate,
        minAmount}=req.body

      
            const existCoupon = await Coupon.findOne({ couponName: couponName })
            if (existCoupon) {
              req.flash('error', 'already exists a coupon with this name')
              res.redirect('/admin/addCoupon')
            } else {
        
              const coupon = new Coupon({
                couponName: req.body.couponName,
                code: code,
                discount:discount,
                startingDate:startingDate,
                expairyDate:expairyDate,
                minAmount:minAmount,
                isListed: false
              })
              await coupon.save();
           //console.log("ccoooppp",coupon);

              res.redirect('/admin/addCoupon')
            }
          } catch (error) {
            console.log(error.messsage);
          }
        }
   

//---------------------------------------------------------------------------------//
//------- Loading the Edit the category----------------------------------------------------------//

const LoadEditCoupon = async (req, res) => {
    try {
      const couponId = req.query.id;
      const couponEdit = await Coupon.findOne({ _id: couponId });
      
      if (!couponEdit) {
       
        req.flash('error', 'Invalid category ID');
        res.redirect('/admin/coupon');
        return;
      }
  
      res.render('editCoupon', { couponEdit });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  }
  //-------------------------------------------------------------------------------------//
  
  //------- Edit the coupon----------------------------------------------------------//
  const editCoupon = async (req, res) => {
    try {
        const id= req.body.editid;
        const newname = req.body.couponName; 
        const newcode = req.body.code; 
        const newdiscount = req.body.discount; 
        const newstartingDate = req.body.startingDate; 
        const newexpairyDate = req.body. expairyDate; 
        const newminAmount = req.body.  minAmount; 
            
    
  
      if (!id) {
        req.flash('error', 'Invalid category ID');
        res.redirect('/admin/coupon');
        return;
      }
  
      const already = await Coupon.findOne({ _id: { $eq: id }, name: newname });
  
      if (already) {
        req.flash('error', 'This name is already exist');
        res.redirect('/admin/category');
      } else {
        await Coupon.findByIdAndUpdate(id, { $set:
             { 
                couponName: newname, 
                code: newcode,
                discount:newdiscount,
                startingDate:newstartingDate,
                expairyDate:newexpairyDate,
                minAmount:newminAmount

              

             } });
        
        res.redirect('/admin/coupon');
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  }
  //-------------------------------------------------------------------------------------//

  //-------------------------------------------------------------------------------------//

  const listCoupon = async (req, res) => {
    try {
  
      const couponid = req.body.id
      console.log("id",couponid);
      const CouponData = await Coupon.findOne({ _id: couponid })
      if (CouponData.isListed === true) {
  
        await Coupon.findByIdAndUpdate({ _id: couponid }, { $set: { isListed: false } })
      } else {
  
        await Coupon.findByIdAndUpdate({ _id: couponid }, { $set: { isListed: true } })
      }
      res.json({ list: true })
    } catch (error) {
      console.log(error.message);
    }
  }
  //-------------------------------------------------------------------------------------//

module.exports={
    LoadAddCoupon,
    addCoupon,
    loadCoupon,
    editCoupon,
    LoadEditCoupon,
    listCoupon
}