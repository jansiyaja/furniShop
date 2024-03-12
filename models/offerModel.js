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
  expiryDate:{
    type:Date,
    required:true
  }
})

module.exports = mongoose.model('Offer',offerSchema)