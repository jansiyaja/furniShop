const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String ,
        unique: true,
        required: true,
    },
    mobile: {
        type:Number,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    image:{
        type:String,
        required:true,
    },
  
     address : [{
            fullName : {
                type: String,
                required: true
            },
            phone : {
                type: Number,
                required: true
            },
            streetAddress : {
                type : String,
                required: true
            },
            city : {
                type : String,
                required : true
            },
            pincode : {
                type :String,
                required: true
            },
            state : {
                type : String,
                required : true
            }
        }] ,
    
    verified:{
        type: Boolean
        
    },
    is_admin: {
        type: Number,
        default: true,
    },
    Blocked :{
        type:Boolean,
        default:false
      },
      createdAt: {
        type: Date,
        default: Date.now,
            
        
        
    },
    
    
});

const User = mongoose.model('User', userSchema);

module.exports = User;