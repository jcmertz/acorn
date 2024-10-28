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

module.exports = function(io) {
    
    router.use(express.urlencoded({ extended: true }));
    
    router.get('/', async (req, res) => {
        let userRecord = await db.User.findOne({ email: "joe@joemertz.com" });
        console.log(userRecord);
        sendMagicLink(userRecord);
        res.render('login/checkEmail');
    });
    
    router.post('/setShowStatus', async (req, res) => {
        const { id, showStatus } = req.body;
        
        const show = await db.Show.findOneAndUpdate({ _id: id }, { showStatus });
        
        res.redirect(req.get("Referrer") || "/");
    });
    
    router.post('/updateShowDetail', async (req, res) => {
        const { id, field, value } = req.body;
        
        console.log(field + ":" + value);
        
        // Use computed property to set the key dynamically
        const update = { [field]: value };
        
        const show = await db.Show.findOneAndUpdate({ _id: id }, update, { new: true });
        
        io.emit('showUpdated:'+id, { showId: id, field, value });
        
        res.redirect(req.get("Referrer") || "/");
    });
    
    
    return router;
};