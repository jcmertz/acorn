var express = require('express');
var bands = require('./bands.js');
var router = express.Router();
var passport = require('passport');
var crypto = require('crypto');
var db = require('../src/db'); //Require the mongoose database init

var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();

var url = require("url");

router.use(express.urlencoded({ extended: true }));

router.get('/', async (req, res) => {
    res.render('admin');
});

router.get('/shows/:id', async (req, res) => {
    const show = await db.Show.findOne({_id:req.params.id})
    res.render('editShow', {
        show:show
    });
});

router.get('/setShowStatus', async (req, res) => {
    var id = req.query.id;
    var status = req.query.showStatus;

    const show = await db.Show.findOneAndUpdate({_id:id},{showStatus:status});
    
    res.redirect(req.get("Referrer") || "/");

});

module.exports = router;