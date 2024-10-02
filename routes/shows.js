
const express = require('express');
const router = express.Router();
const db = require('../src/db');  // Assuming 'db' contains the Mongoose models

// Route to update bands for a show
router.post('/updateBands', async (req, res) => {
    try {
        const { showId, bands } = req.body;

        // Find the show by its ID and update the bands array
        const show = await db.Show.findById(showId);
        if (!show) {
            return res.status(404).send('Show not found');
        }

        show.bands = bands;
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
