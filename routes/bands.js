var express = require('express');
var router = express.Router();
var passport = require('passport');
var crypto = require('crypto');
var db = require('../src/db'); //Require the mongoose database init
const { sendMagicLink,registerBand } = require('../src/utilities');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();

var url = require("url");

router.use(express.urlencoded({ extended: true }));

router.get('/newEvent/:month/:day/:year', ensureLoggedIn, async (req, res) => { //Pulls open a form for a band to fill out
    var band = await getBandFromUsername(req.user.username);
    if (band === null){
        req.flash("error","No Band Logged In or Tied to Your User Profile");
        res.redirect("/");
        return;
    }
    var name = band.bandName;
    var knownBands = await getKnownBandList(name);
    res.render('newEvent',{
        month:req.params.month,
        day:req.params.day,
        year:req.params.year,
        bandName:name,
        knownBandData:knownBands,
        errorMessages:res.locals.errorMessages,
        successMessages:res.locals.successMessages
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
        req.flash("error","No Band Found For User");
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
                const newBandUser = await registerBand(data.bands[i].email,data.bands[i].name);
                const userObj = await db.User.findOne({user:newBandUser.user})
                sendMagicLink(userObj);
                const band = await db.Band.findOne({loginInfo:userObj.user});
                show.bands.push(band._id);
                console.log("NEW USER INVITE SENT TO: "+data.bands[i].email);
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

router.post('/band/create', ensureLoggedIn, async (req, res) => {
    try {
        const { newBandName, instagramHandle } = req.body;
        
        // Check if the band already exists
        const existingBand = await db.Band.findOne({ bandName: newBandName });
        if (existingBand) {
            req.flash("error", "Band already exists");
            return res.redirect("/profile");
        }
        
        // Create a new band
        const newBand = new db.Band({
            bandName: newBandName,
            instagram: instagramHandle,
            bandMembers: [req.user._id]
        });
        
        // Save the new band
        await newBand.save();
        
        // Add the new band to the user's bands
        const user = await db.User.findById(req.user.id);
        if(user === null)
            {
            req.flash("error","No User Found");
            res.redirect("/profile");
            return;
        }
        else{
            user.bands.push(newBand._id);
            await user.save();
        }
        req.flash("success", "Band created successfully");
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        req.flash("error", "Server error");
        res.redirect("/profile");
    }
});

router.get('/band/:bandID', ensureLoggedIn, async (req,res) => {
    var isAdmin = false;
    var name;
    const bandId = req.params.bandID;
    console.log(bandId);
    const band = await db.Band.findById(bandId);
    if(band === null){
        console.log("redirecting");
        req.flash("error","Band Not Found");
        res.redirect("/");
        return;
    } else{
        if(req.isAuthenticated()){
            if(req.user.role == 'admin' || req.user.role == 'staff'){
                isAdmin = true;
            }
        }
        
        if(!isAdmin){
            res.redirect("/profile");
            return;
        }
        else if(isAdmin){
            res.render('bandProfile',{
                band: band,
                errorMessages:res.locals.errorMessages,
                successMessages:res.locals.successMessages
            })
        }
    }
});

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

async function getKnownBandList(name){
    var knownBandList = await db.Band.find();
    var knownBands = [];
    for(const knownBand of knownBandList){
        if(knownBand.bandName == name)
            continue;
        knownBands.push(knownBand.bandName);
    }
    return knownBands;
}

module.exports = {
    router:router,
    getBandFromUsername:getBandFromUsername,
    getColorFromStatus:getColorFromStatus,
    getKnownBandList:getKnownBandList
};