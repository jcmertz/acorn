const checkUserRole = (requiredRoles = []) => (req, res, next) => {
  if (!Array.isArray(requiredRoles)) {
    return res.status(500).json({ message: 'Server error. Roles should be an array.' });
  }
  
  if (req.user && requiredRoles.includes(req.user.role)) {
    return next();
  } else {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
};

var db = require('../src/db'); //Require the mongoose database init

async function logMessage(msg){
  const show = await db.Show.findOne({_id:msg.id});
  const newMessage = await db.Message.create({
    user:msg.user,
    msg:msg.message
  });
  show.messages.push(newMessage._id);
  show.save();
};

module.exports = {
  checkUserRole,
  logMessage
};