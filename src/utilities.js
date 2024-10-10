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

const nodemailer = require('nodemailer');
// Configure your SMTP transport (for example, using Gmail SMTP)
let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER, // Your mail server host
  port: 465, // Port for secure SMTP
  secure: true, // Use SSL (recommended for port 465)
  auth: {
    user: process.env.EMAIL, // Your email stored in the environment variable
    pass: process.env.EMAIL_PASSWORD // Your password stored in the environment variable
  }
});

const jwt = require('jsonwebtoken')
const {promisify} = require('util')


async function sendMagicLink(user){
  // Generate JWT
  const createToken = promisify(jwt.sign)
  let token
  try {
    token = await createToken(
      {user: {email: user.email}, iat: Math.floor(Date.now() / 1000)},
      process.env.MAGIC_LINK_SECRET,
      {expiresIn: 60*10} //10 Minutes
    )
  } catch (err) {
    return this.error(err)
  }
  sendToken(user,token);
};

async function sendToken(user, token) {
  const magicLinkUrl = `http://acorn.thefallenlog.com/login/email/verify?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL,
    to: user.email,
    subject: 'Your Magic Login Link',
    text: `Click this link to log in: ${magicLinkUrl}`,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = {
  checkUserRole,
  logMessage,
  sendToken,
  sendMagicLink,
  transporter:transporter
};