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
          orderId2: {
            type: String,
            // required: true
        },
            date:{
                type:Date,
                
              },
          credit:{
            type:Number
          },
          debit:{
            type:Number
          }, 
          reason: {
            type: String,
            required: true
        },
        }
      ]
});

const Wallet = mongoose.model("Wallet", wallet);

module.exports = Wallet;