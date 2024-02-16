const mongoose = require('mongoose');
const product = require('./products');
const ObjectId = mongoose.Schema.Types.ObjectId;

const orderSchema = mongoose.Schema({
  userId:{
    type:ObjectId,
    ref:'User',
    required:true
  },
  products:[
    {
      productId:{
        type:ObjectId,
        ref:'Product',
        required:true
      },
      name:{
        type:String
      },
     
      price:{
        type:Number,
        
      },
      description:{
        type:String,
        
      },
      status :{
        type:String,
        enum: ['placed', 'outForDelivery', 'shipped', 'delivered','cancelled'],
        default:'placed'
      },
      quantity :{
        type:Number,
      },
      cancelReason:{
        type:String,
      },
      returnReason:{
        type:String
      },
    }
  ],
  
  totalAmount:{
    type:Number,
    required:true
  },
  date:{
    type:Date,
    required:true
  },
 expectedDate:{
  type:Date,
  required:true  
 },
   paymentMethod:{
    type:String,
    required:true
  },
  deliveryAddress:{
    type:Object,
    required:true
  },
  paymentId:{
    type:String
  }
})


module.exports = mongoose.model('Order',orderSchema)




  