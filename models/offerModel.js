const mongoose = require('mongoose')

const offerSchema = mongoose.Schema({
  name:{
    type:String,
    required:true
  },
 
  offerPercentage:{
    type:Number,
    required:true
  },
  startingDate:{
    type:Date,
    required:true
  },
  expiryDate:{
    type:Date,
    required:true
  },
  isListed:{
    type:Boolean,
    required:true,
    default:false
  },
})

module.exports = mongoose.model('Offer',offerSchema)