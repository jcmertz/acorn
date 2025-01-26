const mongoose = require('mongoose');

mongoose.connect(process.env.DBHOST);

const userSchema = new mongoose.Schema({
  user: String,
  pass: String,
  salt: String,
  role: String,
  firstName: String,
  lastName: String,
  pronouns: String,
  email: String,
  email_verified: Boolean,
  profilePicture: { type: String, default: '/noProfile.webp' },
  bands: [{type: mongoose.Types.ObjectId, ref: "Band"}]
});
const bandSchema = new mongoose.Schema({
  bandName: String,
  instagram: String,
  genre: String,
  homeTown: String,
  bandMembers: [{type: mongoose.Types.ObjectId, ref: "User"}]
});
const showSchema = new mongoose.Schema({
  showName: String,
  showDate: Date,
  requestDate: Date,
  bands: [{type: mongoose.Types.ObjectId, ref: "Band"}],
  contact: {type: mongoose.Types.ObjectId, ref: "User"},
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
1 - Date Held, in Negotiation
2 - Confirmed
*/
const Band = mongoose.model('Band',bandSchema);
const Show = mongoose.model('Show',showSchema);
const User = mongoose.model('User',userSchema);
const Message = mongoose.model('Message',messageSchema);

module.exports = { Band, Show, User, Message};