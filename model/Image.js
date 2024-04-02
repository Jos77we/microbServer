const mongoose = require("mongoose");

const photoSchems = mongoose.Schema({
  userID: String,
  title: String,
  image: {
    data: Buffer,
    contentType: String,
  },
},
{
  timestamps: true,
});

module.exports = mongoose.model("PhotoImage", photoSchems);