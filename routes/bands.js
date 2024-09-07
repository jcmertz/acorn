var express = require('express');
var router = express.Router();
var passport = require('passport');
var crypto = require('crypto');
var db = require('../src/db'); //Require the mongoose database init

var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();

var url = require("url");

router.use(express.urlencoded({ extended: true }));

router.get('/newEvent/:month/:day/:year', ensureLoggedIn, async (req, res) => { //Pulls open a form for a band to fill out
    var band = await getBandFromUsername(req.user.username);
    var name = band.bandName
    res.render('newEvent',{
        month:req.params.month,
        day:req.params.day,
        year:req.params.year,
        bandName:name,
    }
);
});

router.get('/addEvent',ensureLoggedIn, async (req,res) => { //Handles the form submitted by a band
    const data = url.parse(req.url, true).query;
    const band = new db.Band({bandName:data.bandName});
    const show = new db.Show({
        showDate:data.showDate,
        requestDate:data.reqDate,
        contactBand:band,
        showStatus:0
    });
    show.showDate.setHours(15); // Set the time for the show. This is a hack and should be fixed.
    await band.save();
    await show.save();
    res.redirect("/");
});

router.get('/userDetails',ensureLoggedIn, async (req,res) => {
    console.log(req.user);
    getBandFromUsername(req.user.username);
    res.redirect("/");
});

router.get('/profile',ensureLoggedIn,async (req,res) => {
    var band = await getBandFromUsername(req.user.username);
    res.render('bandProfile',{
        band:band
    })
    
});

function getBandFromUsername(username){
    var band = db.Band.findOne({"loginInfo":username});
    return band;
}

function getColorFromStatus(showStatus){
    switch(showStatus){
        case -1:
            return "#ff0000";
            break;
        case 0:
            return "#ffff00";
            break;
        case 1:
            return "#ffA500";
            break;
        case 2:
            return "#00FF00";
            break;
        default:
            return "gray";
    };
}

module.exports = {
    router:router,
    getBandFromUsername:getBandFromUsername,
    getColorFromStatus:getColorFromStatus
};