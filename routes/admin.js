var express = require('express');
var bands = require('./bands.js');
var router = express.Router();
var passport = require('passport');
var crypto = require('crypto');
var db = require('../src/db'); //Require the mongoose database init

const { sendMagicLink } = require('../src/utilities');  // Bring in the nodemailer object


var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();

var url = require("url");

router.use(express.urlencoded({ extended: true }));

router.get('/', async (req, res) => {
    let userRecord = await db.User.findOne({ email: "joe@joemertz.com" });
    console.log(userRecord);
    sendMagicLink(userRecord);
    res.render('login/checkEmail');
});

router.get('/setShowStatus', async (req, res) => {
    var id = req.query.id;
    var status = req.query.showStatus;

    const show = await db.Show.findOneAndUpdate({_id:id},{showStatus:status});
    
    res.redirect(req.get("Referrer") || "/");

});

module.exports = router;