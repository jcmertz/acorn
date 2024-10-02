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

router.post('/addEvent',ensureLoggedIn, async (req,res) => { //Handles the form submitted by a band
    const data = req.body;
    console.log(data);
    const band = await db.Band.findOne({bandName:data.bands[0].name});
    if (band === null){
        console.log("something went wrong: ");
        console.log("Contact Band Name: "+data.bands[0].name);
        res.redirect("/");
        return;
    }
    const show = new db.Show({
        showDate:data.showDate,
        requestDate:data.reqDate,
        contactBand:band._id,
        showStatus:0
    });
    var showName = "";
    for(let i = 0; i < data.bandCount; i++){
        const band = await db.Band.findOne({bandName:data.bands[i].name});
        if (band !== null ){
            show.bands.push(band._id);
        }
        else{
            if(data.bands[i].email !== null){
                console.log("NEW USER INVITE WOULD HAVE HAPPENED");
            }
        }
        showName = showName + data.bands[i].name + ", ";
    }
    show.showName = showName.slice(0,-2);
    console.log(show.showName);
    show.showDate.setHours(15); // Set the time for the show. This is a hack and should be fixed.
    await show.save();
    res.redirect("/");
});

router.get('/userDetails',ensureLoggedIn, async (req,res) => {
    console.log(req.user);
    getBandFromUsername(req.user.username);
    res.redirect("/");
});

router.get('/profile', ensureLoggedIn, async (req, res) => {
    var band = await getBandFromUsername(req.user.username);
    if (band === null){
        console.log("redirecting");
        res.redirect("/");
        return;
    }
    res.render('bandProfile', {
        band: band
    });
});

// New /band/update POST route
router.post('/band/update', ensureLoggedIn, async (req, res) => {
    try {
        const band = await db.Band.findOne({ "loginInfo": req.user.username });
        if (!band) {
            return res.status(404).send("Band not found");
        }
        
        // Update band details from the form data
        band.bandName = req.body.bandName;
        band.contactEmail = req.body.contactEmail;
        band.instagram = req.body.instagram;
        band.genre = req.body.genre;
        band.homeTown = req.body.homeTown;
        
        // Save the updated band details
        await band.save();
        
        // Redirect back to the profile page after successful update
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get('/shows/:id', async (req, res) => {
    const show = await db.Show.findOne({_id:req.params.id}).populate('messages').populate('bands').populate('contactBand');
    var isAdmin = false;
    if(req.isAuthenticated()){
        if(req.user.role == 'admin' || req.user.role == 'staff'){
            isAdmin = true;
        }
    }
    res.render('editShow', {
        show:show,
        user:req.user.username,
        isAdmin:isAdmin
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