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
  })

module.exports = router;