const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
    area: { type: String, trim: true, default: "indoor" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Table || mongoose.model("Table", tableSchema);
