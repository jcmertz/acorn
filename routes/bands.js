var express = require('express');
var router = express.Router();
var passport = require('passport');
var crypto = require('crypto');
var db = require('../src/db'); //Require the mongoose database init
const { sendMagicLink,sendBandInvite, registerUser } = require('../src/utilities');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();
const util = require("../src/utilities.js");

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
    //console.log(data);
    
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
    //console.log(bandId);
    const band = await db.Band.findById(bandId).populate("bandMembers");
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

router.post('/band/:bandID/update', ensureLoggedIn, async (req, res) => {
    try {
        console.log()
        const band = await db.Band.findById(req.params.bandID);
        if (!band) {
            console.log("redirecting");
            req.flash("error","Band Not Found");
            res.redirect("/profile");
            return;       
        }
        
        // Update band details from the form data
        band.bandName = req.body.bandName;
        band.instagram = req.body.instagram;
        band.genre = req.body.genre;
        band.homeTown = req.body.homeTown;
        
        // Save the updated band details
        await band.save();
        
        // Redirect back to the profile page after successful update
        res.redirect('/band/' + req.params.bandID);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});


router.post('/band/:bandID/addMember', ensureLoggedIn, async (req, res) => {
    try {
        const { memberEmail } = req.body;
        const band = await db.Band.findById(req.params.bandID);
        
        if (!band) {
            req.flash("error", "Band not found");
            return res.redirect('/band/' + req.params.bandID);
        }
        
        const user = await db.User.findOne({ email: memberEmail });
        
        if (user) {
            // User exists, add to band
            band.bandMembers.push(user._id);
            await band.save();
            
            user.bands.push(band._id);
            await user.save();
            
            req.flash("success", "Member added to band");
        } else {
            // User does not exist, send join link
            const joinCode = crypto.randomBytes(20).toString('hex');
            band.joinCodes.push(joinCode);
            await band.save();
            
            sendBandInvite(memberEmail, joinCode, band.bandName, req.params.bandID);
            req.flash("success", "Invitation sent to new member");
        }
        
        res.redirect('/band/' + req.params.bandID);
    } catch (error) {
        console.error(error);
        req.flash("error", "Server error");
        res.redirect('/band/' + req.params.bandID);
    }
});

router.get('/band/:bandID/join/:inviteCode', async (req, res) => {
    const { bandID, inviteCode } = req.params;
    
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
    
    try {
        const band = await db.Band.findById(bandID);
        if (!band) {
            req.flash("error", "Band not found");
            return res.redirect('/');
        }
        
        const invite = band.joinCodes.find((code) => code === inviteCode);
        if (!invite) {
            req.flash("error", "Invalid or expired invite code");
            return res.redirect('/');
        }
        
        const user = await db.User.findById(req.user.id);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect('/');
        }
        
        band.bandMembers.push(user._id);
        band.joinCodes = band.joinCodes.filter(code => code !== inviteCode);
        await band.save();
        
        user.bands.push(band._id);
        await user.save();
        
        req.flash("success", "Successfully joined the band");
        res.redirect('/band/' + bandID);
    } catch (error) {
        console.error(error);
        req.flash("error", "Server error");
        res.redirect('/');
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

// New route for managing bands (admin/staff only)
router.get('/bands/manage', util.checkUserRole(['staff', 'admin']), async (req, res) => {
    try {
        // Fetch all bands with their members
        const bands = await db.Band.find().populate('bandMembers');
        
        res.render('manageBands', {
            userName: req.user.username,
            isLoggedIn: req.isAuthenticated(),
            userRole: req.user.role,
            bands: bands,
            errorMessages: res.locals.errorMessages,
            successMessages: res.locals.successMessages
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "Error fetching bands");
        res.redirect("/");
    }
});

// Route for creating a band (from the manage bands page)
router.post('/bands/create', util.checkUserRole(['staff', 'admin']), async (req, res) => {
    try {
        const { newBandName, instagramHandle, genre, homeTown } = req.body;
        
        // Check if the band already exists
        const existingBand = await db.Band.findOne({ bandName: newBandName });
        if (existingBand) {
            req.flash("error", "Band already exists");
            return res.redirect("/bands/manage");
        }
        
        // Create a new band
        const newBand = new db.Band({
            bandName: newBandName,
            instagram: instagramHandle,
            genre: genre,
            homeTown: homeTown,
            bandMembers: []
        });
        
        // Save the new band
        await newBand.save();
        
        req.flash("success", "Band created successfully");
        res.redirect("/bands/manage");
    } catch (error) {
        console.error(error);
        req.flash("error", "Server error");
        res.redirect("/bands/manage");
    }
});

// Route for deleting a band
router.post('/bands/:bandId/delete', util.checkUserRole(['staff', 'admin']), async (req, res) => {
    try {
        const bandId = req.params.bandId;
        
        // Find the band
        const band = await db.Band.findById(bandId);
        if (!band) {
            req.flash("error", "Band not found");
            return res.redirect("/bands/manage");
        }
        
        // Find all shows that include this band
        const shows = await db.Show.find({ bands: bandId });
        
        // Remove the band from all shows
        for (const show of shows) {
            show.bands = show.bands.filter(b => b.toString() !== bandId);
            await show.save();
        }
        
        // Remove the band from all users
        const users = await db.User.find({ bands: bandId });
        for (const user of users) {
            user.bands = user.bands.filter(b => b.toString() !== bandId);
            await user.save();
        }
        
        // Delete the band
        await db.Band.findByIdAndDelete(bandId);
        
        req.flash("success", "Band deleted successfully");
        res.redirect("/bands/manage");
    } catch (error) {
        console.error(error);
        req.flash("error", "Server error");
        res.redirect("/bands/manage");
    }
});

module.exports = {
    router: router,
    getBandsFromUsername: getBandsFromUsername,
    getColorFromStatus: getColorFromStatus,
    getKnownBandList: getKnownBandList
};