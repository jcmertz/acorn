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

module.exports = router;
