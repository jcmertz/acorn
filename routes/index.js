var db = require('../src/db');
var express = require('express');

var router = express.Router();
const { sendMagicLink } = require('../src/utilities');  // Bring in the nodemailer object

var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();


router.get('/', async (req, res) => {
  //console.log(data);
  //console.log(req.isAuthenticated());
  var isAdmin = false;
  if(req.isAuthenticated()){
    if(req.user.role == 'admin' || req.user.role == 'staff'){
      isAdmin = true;
    }
  }
  res.render('index',{
    isLoggedIn:req.isAuthenticated(),
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
        errorMessages:res.locals.errorMessages,
        successMessages:res.locals.successMessages
    });
});


// Test Route
router.get('/test', async (req, res) => {
  let userRecord = await db.User.findOne({ email: "joe@joemertz.com" });
  console.log(userRecord);
  sendMagicLink(userRecord);
  res.render('login/checkEmail',{
    errorMessages:res.locals.errorMessages,
    successMessages:res.locals.successMessages
  });
});

module.exports = router;
