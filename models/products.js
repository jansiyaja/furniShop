const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;

const productSchema  = mongoose.Schema({

  name:{
    type:String,
    required:true
  },
  
  price:{
    type:Number,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  category :{
    type: ObjectId,
    ref:'Category',
    required:true
  },
  offer :{
    type : String,
    required: false,
  },
  images: {
    type:Array,
    validate :[arrayLimit,'you can pass only 4 images']
  },
  is_Listed :{
    type :Boolean,
    default:false,
    required:true
  },
  stock :{
    type:Number,
    required:true
  }
})
function arrayLimit(val){
  return val.length <=4;
}


const product = mongoose.model('Product',productSchema)
module.exports = product;