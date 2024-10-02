
const express = require('express');
const router = express.Router();
const db = require('../src/db');
var bandUtils = require('./bands.js');


router.get('/edit/:id', async (req, res) => {
    const show = await db.Show.findOne({_id:req.params.id}).populate('messages').populate('bands').populate('contactBand');
    var isAdmin = false;
    var name;
    if(req.isAuthenticated()){
        if(req.user.role == 'admin' || req.user.role == 'staff'){
            isAdmin = true;
        }else{
            name = await bandUtils.getBandFromUsername(req.user.username)
        }
    }
    var knownBands = await bandUtils.getKnownBandList(name);
    res.render('editShow', {
        show:show,
        user:req.user.username,
        isAdmin:isAdmin,
        knownBandData:knownBands
    });
});

// Route to update bands for a show
router.post('/updateBands', async (req, res) => {
    try {
        const { showId, bands } = req.body;
        // Find the show by its ID and update the bands array
        const show = await db.Show.findById(showId);
        if (!show) {
            return res.status(404).send('Show not found');
        }
        bandsOut=[];
        console.log(bands);
        for(band of bands){
            var bandObj = await db.Band.findOne({"bandName":band.name});
            bandsOut.push(bandObj._id)
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
router.post('/setPrimaryBand', async (req, res) => {
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

module.exports = router;
