const mongoose = require('mongoose');
const product = require('./products');
const ObjectId = mongoose.Schema.Types.ObjectId;

const orderSchema = mongoose.Schema({
  userId:{
    type:ObjectId,
    ref:'User',
    required:true
  },
  orderId:{
    type:String,
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
     
      status :{
        type:String,
        enum:  ['success','placed','pending', 'outForDelivery','returnRequested','returned' ,'returnDenied','shipped', 'delivered','cancelled'],
        default:'pending'
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
  
  coupon: {
    type: Number,
    default: 0,
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




  