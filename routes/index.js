var db = require('../src/db');
var express = require('express');

var router = express.Router();
const { sendMagicLink, upload } = require('../src/utilities');  // Bring in the nodemailer and multer objects

var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
const fs = require('fs');
const path = require('path');
var ensureLoggedIn = ensureLogIn();


router.get('/', async (req, res) => {
  //console.log(data);
  //console.log(req.isAuthenticated());
  var isAdmin = false;
  var userName = "";
  if(req.isAuthenticated()){
    if(req.user.role == 'admin' || req.user.role == 'staff'){
      isAdmin = true;
    }
    userName = req.user.username;
  }
  res.render('index',{
    isLoggedIn:req.isAuthenticated(),
    userName:userName,
    isAdmin:isAdmin,
    errorMessages:res.locals.errorMessages,
    successMessages:res.locals.successMessages
  });
})

router.get('/profile', ensureLoggedIn, async (req, res) => {
  var user = await db.User.findOne({"user":req.user.username}).populate("bands");
  if (user === null){
    console.log("redirecting");
    res.redirect("/");
    req.flash("error","Something went wrong. We couldn't find your user profile. Contact Fallen Log for Support.");
    return;
  }
  res.render('userProfile', {
    user: user,
    userName: req.user.username,
    isLoggedIn: req.isAuthenticated(),
    errorMessages:res.locals.errorMessages,
    successMessages:res.locals.successMessages
  });
});

router.post('/user/update',ensureLoggedIn, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await db.User.findOne({ "user": req.user.username });
    if (!user) {
      console.log("redirecting");
      res.redirect("/");
      req.flash("error","Something went wrong. We couldn't find your user profile. Contact Fallen Log for Support.");
      return;
    }
    
    // Update band details from the form data
    user.user = req.body.userName;
    user.email = req.body.email;
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.pronouns = req.body.pronouns;
    if (req.file) {
      // Delete the old profile picture if it exists
      if (user.profilePicture && user.profilePicture !== '/noProfile.webp') {
      const oldPath = path.join(__dirname, '..', 'public', user.profilePicture);
      fs.unlink(oldPath, (err) => {
        if (err) {
        console.error(`Failed to delete old profile picture: ${err.message}`);
        }
      });
      }
      // Save the new profile picture path
      user.profilePicture = `/uploads/${req.file.filename}`;
    }
    
    // Save the updated band details
    await user.save();
    
    // Redirect back to the profile page after successful update
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
