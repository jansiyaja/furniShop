const mongoose = require ("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId
const wallet = mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true
      },
      amount:{
        type:Number,
        default:0
      },

      walletHistory :[
        {
        
          date:{
            type : Date
          },
          orderData:{
            type:Array()
          }
        }
      ]
});

const Wallet = mongoose.model("Wallet", wallet);

module.exports = Wallet;