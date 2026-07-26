const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default:"user" },
  },
  { minimize: false }
);

const UserModel = mongoose.model.user || mongoose.model("User", UserSchema);

module.exports = UserModel
