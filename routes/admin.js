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
const { loadGetInitialProps } = require('next/dist/shared/lib/utils.js');

module.exports = function(io) {
    
    router.use(express.urlencoded({ extended: true }));
    
    router.get('/', async (req, res) => {
        let userRecord = await db.User.findOne({ email: "joe@joemertz.com" });
        console.log(userRecord);
        sendMagicLink(userRecord);
        res.render('login/checkEmail');
    });
    
    return router;
};