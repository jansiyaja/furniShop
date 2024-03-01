
  const mongoose = require("mongoose")
  const ObjectId = mongoose.Schema.Types.ObjectId;
const Schema = mongoose.Schema;
const returnSchema = new Schema({
    orderId: {
         type: ObjectId, 
         ref: 'Order',
          required: true 
        },

    productId: 
    { type: ObjectId,
         ref: 'Product',
          required: true
         },
    returnStatus:
     { type: String,
         enum: ['requested', 'accepted', 'denied'],
          default: 'requested' },
   
    UserId: {
         type: ObjectId, 
         ref: 'User' },
    date:{
        type:Date,
    } 
   
  });
 
module.exports = mongoose.model('Return',returnSchema)