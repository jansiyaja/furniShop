const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const couponSchema = new Schema({
    couponName: {
        type: String,
        required: true
    },
    code: {
         type: String, 
         unique: true
         },
    discount: {
        type: Number,
        required: true
    },
    startingDate:{
        type:Date,
        require:true
    },
    expairyDate:{
        type:Date,

    }, 
    minAmount: {
        type: Number,
        required: true
    },
    isListed:{
        type:Boolean,
        required:true,
        default:false
      }
    
})
module.exports= Coupon = mongoose.model('coupon',couponSchema)