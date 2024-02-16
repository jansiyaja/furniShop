const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
   userId: {
    type:mongoose.Schema.Types.ObjectId,
    required: true,
    ref:'userData'
   },

   productId: {
    type:[mongoose.Schema.Types.ObjectId],
    require:true,
    ref: 'Product',
   
   }
    
    

})

module.exports= wishlistProduct = mongoose.model('wishlistProducts',wishlistSchema)