var express = require('express');
var router = express.Router();
var passport = require('passport');
var crypto = require('crypto');
var db = require('../src/db'); //Require the mongoose database init

var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();

var url = require("url");

router.use(express.urlencoded({ extended: true }));


router.get('/getRange', async function(req, res, next) {
    var start = req.query.start;
    var end = req.query.end;
    console.log("Start: "+start);
    console.log("End: "+end);
    const data = await db.Show.find({
        showDate: {
            $gte: start,
            $lte: end
        }
    } );
    var events = [];
    for (const event in data){
        events.push({
            title: data[event].contactBand.bandName,
            start: data[event].showDate,
        })
    }
    res.send(events);
});

module.exports = router;