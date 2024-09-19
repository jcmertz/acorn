const mongoose = require('mongoose');

mongoose.connect(process.env.DBHOST);

const userSchema = new mongoose.Schema({
  user: String,
  pass: String,
  salt: String,
  role: String
});
const bandSchema = new mongoose.Schema({
  bandName: String,
  contactEmail: String,
  instagram: String,
  genre: String,
  homeTown: String,
  loginInfo: String
});
const showSchema = new mongoose.Schema({
  showDate: Date,
  requestDate: Date,
  bands: [bandSchema],
  contactBand: bandSchema,
  matinee:Boolean,
  ticketPrice:Number,
  ticketsSold:Number,
  showStatus:Number,
  messages:[{type: mongoose.Types.ObjectId, ref: "Message"}]
});
const messageSchema = new mongoose.Schema({
  user:String,
  msg:String
}, 
{ timestamps: true }
);
/*
Show Status:
-1 - Rejected or Cancelled
0 - Submitted, not responded to
1 - In Negotiation
2 - Confirmed
*/
const Band = mongoose.model('Band',bandSchema);
const Show = mongoose.model('Show',showSchema);
const User = mongoose.model('User',userSchema);
const Message = mongoose.model('Message',messageSchema);

module.exports = { Band, Show, User, Message};