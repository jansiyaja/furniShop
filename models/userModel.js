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
    
    
});

const User = mongoose.model('User', userSchema);

module.exports = User;