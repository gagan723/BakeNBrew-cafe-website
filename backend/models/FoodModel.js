const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
}, { timestamps: true });

const foodModel = mongoose.model('Food',foodSchema)

module.exports = foodModel
