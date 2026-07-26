const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true, index: true },
    partySize: { type: Number, required: true, min: 1, max: 12 },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true }
);

reservationSchema.index({ tableId: 1, startAt: 1, endAt: 1, status: 1 });

module.exports = mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema);
