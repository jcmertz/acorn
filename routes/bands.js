var express = require('express');
var router = express.Router();
var passport = require('passport');
var crypto = require('crypto');
var db = require('../src/db'); //Require the mongoose database init
const { sendMagicLink,registerUser } = require('../src/utilities');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();

var url = require("url");

router.use(express.urlencoded({ extended: true }));

router.get('/newEvent/:month/:day/:year', ensureLoggedIn, async (req, res) => { //Pulls open a form for a band to fill out
    var band = await getBandsFromUsername(req.user.username);
    if (band === null){
        req.flash("error","No Band Logged In or Tied to Your User Profile");
        res.redirect("/");
        return;
    }
    var knownBands = await getKnownBandList();
    res.render('newEvent',{
        userName:req.user.username,
        isLoggedIn:req.isAuthenticated(),
        month:req.params.month,
        day:req.params.day,
        year:req.params.year,
        userName:req.user.username,
        knownBandData:knownBands,
        errorMessages:res.locals.errorMessages,
        successMessages:res.locals.successMessages
    }
);
});

router.post('/addEvent',ensureLoggedIn, async (req,res) => { //Handles the form submitted by a band
    const data = req.body;
    console.log(data);
    
    const show = new db.Show({
        showDate:data.showDate,
        requestDate:data.reqDate,
        contact:req.user.id,
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
                try {
                    const newBandUser = await registerUser(data.bands[i].email, data.bands[i].name);
                    const userObj = await db.User.findOne({ user: newBandUser.user });
                    if (userObj) {
                        sendMagicLink(userObj);
                        const newBand = new db.Band({
                            bandName: data.bands[i].name,
                            bandMembers: [userObj._id]
                        });
                        await newBand.save();
                        if (newBand) {
                            show.bands.push(newBand._id);
                            newBand.bandMembers.push(userObj._id);
                            await newBand.save();
                            userObj.bands.push(newBand._id);
                            await userObj.save();
                            console.log("NEW USER INVITE SENT TO: " + data.bands[i].email);
                        } else {
                            console.error("New band not found for band name: " + data.bands[i].name);
                        }
                    } else {
                        console.error("User object not found for new band user: " + newBandUser.user);
                    }
                } catch (err) {
                    console.error("Error processing new band user: ", err);
                }
            }
        }
        showName = showName + data.bands[i].name + ", ";
    }
    show.contact = await db.User.findById(req.user.id);
    show.showName = showName.slice(0,-2);
    console.log("New Show created:");
    console.log(show);
    show.showDate.setHours(15); // Set the time for the show. This is a hack and should be fixed.
    await show.save();
    res.redirect("/");
});

router.get('/userDetails',ensureLoggedIn, async (req,res) => {
    console.log(req.user);
    getBandsFromUsername(req.user.username);
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
            bandMembers: [req.user.id]
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
            //If the user is an admin or a member of the band, show the private band profile
            if(isAdmin || band.bandMembers.some(user => user._id.toString() === req.user.id.toString()) ){
                
                res.render('privateBandProfile',{
                    userName:req.user.username,
                    isLoggedIn:req.isAuthenticated(),
                    band: band,
                    errorMessages:res.locals.errorMessages,
                    successMessages:res.locals.successMessages
                })
            } else{ //If the user is not a member of the band, show the public band profile
                res.render('publicBandProfile',{
                    isLoggedIn:req.isAuthenticated(),
                    userName:req.user.username,
                    band: band,
                    errorMessages:res.locals.errorMessages,
                    successMessages:res.locals.successMessages
                })  
            }
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



async function getBandsFromUsername(username){
    var user = await db.User.findOne({"user":username}).populate("bands");
    if(user === null){
        console.log("something went wrong: ");
        console.log("Username: "+username);
        req.flash("error","User doesn't exist");
        res.redirect("/");
        return;
    }
    bands = user.bands;
    return bands;
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

async function getKnownBandList(){
    var knownBandList = await db.Band.find();
    var knownBands = [];
    for(const knownBand of knownBandList){
        knownBands.push(knownBand.bandName);
    }
    return knownBands;
}

module.exports = {
    router:router,
    getBandsFromUsername:getBandsFromUsername,
    getColorFromStatus:getColorFromStatus,
    getKnownBandList:getKnownBandList
};