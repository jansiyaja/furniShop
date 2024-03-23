const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const Offer = require('../models/offerModel'); // Import Offer model

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    offer: {
        type: ObjectId,
        ref: 'Offer',
        required: false,
    },
    description: {
        type: String,
    },
    isListed: {
        type: Boolean,
        required: true,
        default: false
    }
});

categorySchema.pre('save', async function(next) {
    if (this.offer) {
        try {
            const offer = await Offer.findById(this.offer);
            const currentDate = Date.now();
            if (offer && offer.expiryDate < currentDate) {
                console.log("Offer in category has expired, removing from category.");
                this.offer = undefined; // Assigning undefined removes the field
            } else {
                console.log("Offer in category is still valid.");
            }
        } catch (error) {
            console.error("Error while checking offer expiry in category:", error);
        }
    }
    next();
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
