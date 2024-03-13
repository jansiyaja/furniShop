const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;
const categorySchema = mongoose.Schema({
    name:{
      type:String,
      required:true
      
    },
    offer:{
      type : ObjectId,
      ref:'Offer',
      required: false,
    },
    description:{
      type:String,
      
    },
    isListed:{
      type:Boolean,
      required:true,
      default:false
    }
})
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

   