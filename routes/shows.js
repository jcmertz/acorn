
const express = require('express');
const router = express.Router();
const db = require('../src/db');
var bandUtils = require('./bands.js');
const { sendMagicLink,registerUser } = require('../src/utilities');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();

module.exports = function(io) {
    
    router.get('/edit/:id', async (req, res) => {
        const show = await db.Show.findOne({_id:req.params.id}).populate('messages').populate('bands').populate('contact');
        var isAdmin = false;
        if(req.isAuthenticated()){
            if(req.user.role == 'admin' || req.user.role == 'staff'){
                isAdmin = true;
            }
        }
        var knownBands = await bandUtils.getKnownBandList();
        res.render('editShow', {
            show:show,
            user:req.user.username,
            userName:req.user.username,
            isLoggedIn:req.isAuthenticated(),
            isAdmin:isAdmin,
            knownBandData:knownBands,
            errorMessages:res.locals.errorMessages,
            successMessages:res.locals.successMessages
        });
    });
    
    // Route to update bands for a show
    router.post('/updateBands', async (req, res) => {
        try {
            const { showId, bands } = req.body;
            // Find the show by its ID and update the bands array
            const show = await db.Show.findById(showId);
            if (!show) {
                return res.status(500).send('Show not found');
            }
            bandsOut=[];
            for(band of bands){
                var bandObj = await db.Band.findOne({"bandName":band.name});
                if (bandObj !== null ){
                    bandsOut.push(bandObj._id);
                try {
                    const newBandUser = await registerUser(band.email, band.name);
                    const userObj = await db.User.findOne({ user: newBandUser.user });
                    if (userObj) {
                        sendMagicLink(userObj);
                        const newBand = await db.Band.findOne({ bandName: band.name });
                        if (newBand) {
                            bandsOut.push(newBand._id);
                            newBand.bandMembers.push(userObj._id);
                            await newBand.save();
                            userObj.bands.push(newBand._id);
                            await userObj.save();
                            console.log("NEW USER INVITE SENT TO: " + band.email);
                        } else {
                            console.error("New band not found for band name: " + band.name);
                        }
                    } else {
                        console.error("User object not found for new band user: " + newBandUser.user);
                    }
                } catch (err) {
                    console.error("Error processing new band user: ", err);
                }
                }
            }
            show.bands = bandsOut;
            await show.save();
            
            res.redirect('/shows/edit/' + showId);  // Redirect back to the edit page
        } catch (err) {
            console.error(err);
            res.status(500).send('Server error');
        }
    });
    
    // Route to set a new primary contact band
    /*
    router.post('/setPrimaryBand',ensureLoggedIn, async (req, res) => {
        try {
    const { showId, bandId } = req.body;
    
    // Find the show and set the new primary contact band
    const show = await db.Show.findById(showId);
    if (!show) {
    return res.status(404).send('Show not found');
    }
    
    const newPrimaryBand = await db.Band.findById(bandId);
    if (!newPrimaryBand) {
    return res.status(404).send('Band not found');
    }
    
    show.contactBand = newPrimaryBand;
    await show.save();
    
    res.redirect('/shows/edit/' + showId);  // Redirect back to the edit page
    } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
    }
    });
    */
    
    const adjustToCentralTime = (date) => {
        if (!date) return null;
        // Create a date object
        let adjustedDate = new Date(date);
        // Adjust to 8 PM Central Time (US Central Time is UTC-6 or UTC-5 depending on daylight saving)
        adjustedDate.setUTCHours(20); // Set to 8:00 PM
        return adjustedDate;
    };
    
    
    router.post('/updateShowDetail',ensureLoggedIn, async (req, res) => {
        let { id, field, value } = req.body;
        
        console.log(field + ":" + value);
        
        if(field === "showDate") {
            value = adjustToCentralTime(value);
        }
        
        // Use computed property to set the key dynamically
        const update = { [field]: value };
        
        const show = await db.Show.findOneAndUpdate({ _id: id }, update, { new: true });
        
        io.emit('showUpdated:'+id, { showId: id, field, value });
        
        res.redirect(req.get("Referrer") || "/");
    });
    
    return router;
    
}
