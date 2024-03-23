const Coupon=require('../models/couponModel');

const Cart=require('../models/cartModel'); 


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

//---------- load adding the Coupon-----------------------------------------------------------------------//
const LoadAddCoupon = async (req,res)=>{
  
   
  try {
    
    res.render('addCoupon')
  } catch (error) {
    console.log(error.message);
  }
}


//---------------------------------------------------------------------------------//
//-------------Adding the Coupon--------------------------------------------------------------------/

const addCoupon = async (req,res)=>{
  try {
   
    console.log(req.body);
             const{couponName,
             
             discount,
             startingDate,
             expairyDate,
           minAmount}=req.body
    const firstName = couponName.split('').splice(1,3).join('')
    const randomString = Math.random().toString(36).substring(2, 7);
    const randomNumber = `${Math.floor(1000 + Math.random() * 9000)}`;

    const existName = await Coupon.findOne({couponName:couponName})
    if(existName){
      req.flash('exists','this coupon name is already exists')
      res.redirect('/admin/addCoupon')
    }else{
      const newCoupon = new Coupon({
        couponName:couponName,
        code:`${firstName}${randomString}${randomNumber}`,
        startingDate:startingDate,
        expairyDate:expairyDate,
        minAmount:minAmount,
        discount:discount
      })
  
      await newCoupon.save()
      res.redirect('/admin/addCoupon')
    }


  } catch (error) {
    console.log(error.message);
  }
}

   

//---------------------------------------------------------------------------------//


//------- Loading the Edit the category----------------------------------------------------------//


  const LoadEditCoupon = async (req,res)=>{
   
    try {
      const id = req.query.id;
      const coupon = await Coupon.findOne({_id:id})
      console.log(coupon);
      res.render('editCoupon',{coupon:coupon})
    } catch (error) {
      console.log(error.message);
    }
  }
  
  //-------------------------------------------------------------------------------------//
  
  //------- Edit the coupon----------------------------------------------------------//
  const editCoupon = async (req, res) => {
    
    try {
      
      console.log(req.body);
        const id= req.body.editid;
        const newname = req.body.couponName; 
        const newcode = req.body.code; 
        const newdiscount = req.body.discount; 
        const newstartingDate = req.body.startingDate; 
        const newexpairyDate = req.body. expairyDate; 
        const newminAmount = req.body.  minAmount; 
            
    
  
  
        const already = await Coupon .findOne({ _id: { $ne: id }, couponName: newname });
        console.log("already",already);
      if (already) {
        req.flash('error', 'This name is already exist');
        res.redirect('/admin/coupon');

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
      res.redirect('/admin/error');
    }
  }
  
  //-------------------------------------------------------------------------------------//

  //-------------------------------------------------------------------------------------//
  const listCoupon = async (req, res) => {
    try {
        const couponid = req.body.id;
        console.log("id", couponid);
        const CouponData = await Coupon.findOne({ _id: couponid });

        if (CouponData.isListed === true) {
            await Coupon.findByIdAndUpdate({ _id: couponid }, { $set: { isListed: false } });
        } else {
            await Coupon.findByIdAndUpdate({ _id: couponid }, { $set: { isListed: true } });
        }

        const updatedCouponData = await Coupon.findOne({ _id: couponid });
        res.json({ newListStatus: updatedCouponData.isListed });
    } catch (error) {
        console.log(error.message);
       res.redirect('/admin/error');
    }
};

  //-------------------------------------------------------------------------------------//
  //---------Add Coupon----------------------------------------------------------------------------//
 
  //   const couponApply = async (req, res) => {
  //     try {
  //         const cCode = req.body.couponCode;
  //         const price = req.body.totalPrice;
  //        console.log(price);
  //         const userId = req.session.user.id;
  //         const couponCode = await Coupon.findOne({ code: cCode });
  //         console.log(couponCode);
  //         console.log(userId);
  
  //         if (couponCode) {
  //             const alreadyUsed = couponCode.userUsed.find((user) => user.userId === userId);
  //           //  const alreadyUsed = couponCode.userUsed.find((user) => user.userId === userId);
  //             //console.log("alreadyUsed",alreadyUsed);
  //             if (!alreadyUsed) {
  //                 const currentDate = new Date();
  // console.log(currentDate);
  //                 if (couponCode.expairyDate > currentDate) {
  //                     const cartData = await Cart.findOne({ userId: userId });
  //                     console.log("cartData",cartData);
  
  //                     if (cartData) {
  //                         const total = cartData.products.reduce((acc, value) => acc += value.totalPrice, 0);
  //                         console.log("total",total);
  
  //                         if (price >= couponCode.minAmount) {
  //                             let discount = 0;
  //                             let cartAmount = 0;
  
  //                             if (couponCode.discount) {
  //                                 const dics = couponCode.discount / cartData.products.length;
  //                                 console.log(dics);
  //                                 discount = Math.round(dics);
  
  //                                 cartAmount = cartData.products.reduce((acc, value) => {
  //                                     if (value.totalPrice >= discount) {
  //                                         return acc += (value.totalPrice - discount);
  //                                     } else {
  //                                         return acc += value.totalPrice;
  //                                     }
  //                                 }, 0);
  //                             }
  //                             console.log("cartAmount",cartAmount);
  //                             res.json({ success: true, subTotal: cartAmount });
  //                         } else {
  //                             res.json({ min: true, message: 'Minimum amount needed' });
  //                         }
  //                     } else {
  //                         res.json({ notAvailable: true, message: 'Shopping cart not found' });
  //                     }
  //                 } else {
  //                     res.json({ expired: true, message: 'This coupon is expired' });
  //                 }
  //             } else {
  //                 res.json({ alreadyUsed: true, message: 'This coupon is already used' });
  //             }
  //         } else {
  //             res.json({ notAvailable: true, message: 'Coupon is not available' });
  //         }
  //     } catch (error) {
  //         console.log(error.message);
          
  //     res.redirect('/error404');
  //     }
  // };
  const couponApply = async (req, res) => {
    try {
        const cCode = req.body.couponCode;
        const price = req.body.totalPrice;
        const userId = req.session.user.id;
        const couponCode = await Coupon.findOne({ code: cCode });
        const currentDate = new Date();

        if (couponCode) {
            const alreadyUsed = couponCode.userUsed.find((user) => user.userId === userId);
            if (!alreadyUsed) {
                if (couponCode.expairyDate > currentDate) {
                    const cartData = await Cart.findOne({ userId: userId });
                    
                    if (cartData) {
                        
                        const total = price
                        console.log("total",total);
                        if (total >= couponCode.minAmount) {
                          let cartAmount = total;
                         
                          if (couponCode.discount) {
                             
                              const discountAmount = Math.min(couponCode.discount, cartAmount);
                              
                         
                              cartAmount -= discountAmount;
                          }
                  
                          console.log("cartAmount", cartAmount);
                          res.json({ success: true, subTotal: cartAmount });
                      } else {
                          res.json({ min: true, message: 'Minimum amount needed' });
                      }
                    } else {
                        res.json({ notAvailable: true, message: 'Shopping cart not found' });
                    }
                } else {
                    res.json({ expired: true, message: 'This coupon is expired' });
                }
            } else {
                res.json({ alreadyUsed: true, message: 'This coupon is already used' });
            }
        } else {
            res.json({ notAvailable: true, message: 'Coupon is not available' });
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/error404');
    }
};

  //-------------------------------------------------------------------------------------//
  //-------------------------------------------------------------------------------------//

module.exports={
    LoadAddCoupon,
    addCoupon,
    loadCoupon,
    editCoupon,
    LoadEditCoupon,
    listCoupon,
    couponApply
}