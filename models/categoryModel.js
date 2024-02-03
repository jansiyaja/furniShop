const mongoose = require('mongoose')

const categorySchema = mongoose.Schema({
    name:{
      type:String,
      unique: true,
      
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

   