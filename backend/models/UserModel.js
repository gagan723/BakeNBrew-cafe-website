const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default:"user" },
    cartData: { type: Array, default: [] },
    reservations: [
      {
        noOfPeople : {type: Number, required:true},
        time : {type : String, required:true},
        date : {type : String, required:true},
        createdAt: {type: Date, default: Date.now}
      }
    ]
  },
  { minimize: false }
);

const UserModel = mongoose.model.user || mongoose.model("User", UserSchema);

module.exports = UserModel