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
    if (band === null){
        console.log("redirecting");
        res.redirect("/");
        return;
    }
    var name = band.bandName;
    var knownBandList = await db.Band.find();
    var knownBands = [];
    for(const knownBand of knownBandList){
        if(knownBand.bandName == name)
            continue;
        knownBands.push(knownBand.bandName);
    }
    res.render('newEvent',{
        month:req.params.month,
        day:req.params.day,
        year:req.params.year,
        bandName:name,
        knownBands:knownBands
    }
);
});

router.get('/addEvent',ensureLoggedIn, async (req,res) => { //Handles the form submitted by a band
    const data = url.parse(req.url, true).query;
    const band = await db.Band.findOne({bandName:data.bandName});
    if (band === null){
        console.log("redirecting");
        res.redirect("/");
        return;
    }
    const show = new db.Show({
        showDate:data.showDate,
        requestDate:data.reqDate,
        contactBand:band,
        showStatus:0
    });
    show.showDate.setHours(15); // Set the time for the show. This is a hack and should be fixed.
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
    if (band === null){
        console.log("redirecting");
        res.redirect("/");
        return;
    }
    res.render('bandProfile',{
        band:band
    })
    
});

router.get('/shows/:id', async (req, res) => {
    const show = await db.Show.findOne({_id:req.params.id}).populate('messages');
    res.render('editShow', {
        show:show,
        user:req.user.username
    });
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