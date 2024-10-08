var db = require('../src/db');
var express = require('express');

var router = express.Router();
const { sendMagicLink } = require('../src/utilities');  // Bring in the nodemailer object


router.get('/', async (req, res) => {
  //console.log(data);
  //console.log(req.isAuthenticated());
  var isAdmin = false;
  if(req.isAuthenticated()){
    if(req.user.role == 'admin' || req.user.role == 'staff'){
      isAdmin = true;
    }
  }
  const errorMessages = req.flash('error') || [];
  const successMessages = req.flash('success') || [];
  res.render('index',{
    isLoggedIn:req.isAuthenticated(),
    isAdmin:isAdmin,
    errorMessages,
    successMessages
  });
})

router.get('/test', async (req, res) => {
  let userRecord = await db.User.findOne({ email: "joe@joemertz.com" });
  console.log(userRecord);
  sendMagicLink(userRecord);
  res.render('login/checkEmail');
});

module.exports = router;
