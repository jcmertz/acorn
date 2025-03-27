const multer  = require('multer');
const upload = multer({ dest: 'public/uploads/' });

const checkUserRole = (requiredRoles = []) => (req, res, next) => {
  if (!Array.isArray(requiredRoles)) {
    return res.status(500).json({ message: 'Server error. Roles should be an array.' });
  }
  
  if (req.user && req.user.roles && Array.isArray(req.user.roles)) {
    // Check if any of the user's roles match any of the required roles
    const hasRequiredRole = req.user.roles.some(role => requiredRoles.includes(role));
    if (hasRequiredRole) {
      return next();
    }
  }
  
  return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
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

var validator = require("email-validator"); 
async function sendMagicLink(user){
  // Generate JWT
  const createToken = promisify(jwt.sign)
  let token
  if(validator.validate(user.email)){
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
  } else {
    return(new Error("Invalid Email Address"));
  }
};

async function sendToken(user, token) {
  const magicLinkUrl = `http://acorn.thefallenlog.com/login/email/verify?token=${token}`;
  const logoUrl = `http://acorn.thefallenlog.com/AcornAppLogo.svg`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: user.email,
    subject: 'You Have Been Invited to Join The Fallen Log on Acorn',
    text: `Acorn is the booking app for The Fallen Log at Kitchen 17. You have been invited to create an account to manage your upcoming shows. \nClick this link to log in to your account: ${magicLinkUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center;">
        <img src="${logoUrl}" alt="Acorn Logo" style="width: 150px; margin-bottom: 20px;" />
        <h2>You Have Been Invited to join The Fallen Log on Acorn</h2>
        <p>Acorn is the booking app for The Fallen Log at Kitchen 17. You have been invited to create an account to manage your upcoming shows.</p>
        <p>
          <a href="${magicLinkUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">
            Log in to your account
          </a>
        </p>
        <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
        <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

async function sendBandInvite(destination, joinCode, bandName, bandID) {
  const logoUrl = `http://acorn.thefallenlog.com/AcornAppLogo.svg`;
  const linkUrl = `http://acorn.thefallenlog.com/band/${bandID}/join/${joinCode}`;
  console.log("Sending to:");
  console.log(destination);
  console.log(joinCode)
  const mailOptions = {
    from: process.env.EMAIL,
    to: destination,
    subject: `You Have Been Invited to Join ${bandName} on Acorn`,
    text: `Acorn is the booking app for The Fallen Log at Kitchen 17. You have been invited to join ${bandName} on Acorn. \nClick this link to accept the invitation ${linkUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center;">
        <img src="${logoUrl}" alt="Acorn Logo" style="width: 150px; margin-bottom: 20px;" />
        <h2>You Have Been Invited to join ${bandName} on Acorn</h2>
        <p>Acorn is the booking app for The Fallen Log at Kitchen 17. You have been invited to manage ${bandName} on the platform.</p>
        <p>
          <a href="${linkUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">
            Accept the Invitation
          </a>
        </p>
        <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
        <p><a href="${linkUrl}">${linkUrl}</a></p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};


const crypto = require('crypto');
// Promisify the callback-based pbkdf2
const pbkdf2Async = promisify(crypto.pbkdf2);

async function updatePassword(userID,password){
  user = await db.User.findById(userID);
  const salt = crypto.randomBytes(16).toString('hex'); // Synchronously generate the salt
  // Promisified version of pbkdf2
  const hashedPassword = await pbkdf2Async(password, salt, 310000, 32, 'sha256');
  user.pass = hashedPassword.toString('hex'),
  user.salt = salt;
  await user.save();
}

async function registerUser(contactEmail, userName, password) {
  try {
    
    const user = await db.User.create({
      user: userName,
      role: "user",
      email: contactEmail
    });
    
    if(password){
      updatePassword(user._id,password);
    }
    
    // Finding the new user after it's created
    const newUser = await db.User.findOne({ user: userName });
    let loginUser = null;
    if (newUser !== null) {
      loginUser = { id: newUser._id, user: newUser.user };
    }
    return loginUser;
  } catch (err) {
    console.error(err);
    throw new Error('Registration failed');
  }
}



module.exports = {
  checkUserRole,
  logMessage,
  sendToken,
  sendMagicLink,
  sendBandInvite,
  registerUser,
  updatePassword,
  transporter:transporter,
  upload:upload
};