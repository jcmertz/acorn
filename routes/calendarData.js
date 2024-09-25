
var express = require('express');
var router = express.Router();
var db = require('../src/db');

// Route to get event range for regular users
router.get('/getRange', async function(req, res) {
    try {
        const events = await db.Event.find({});  // Replace with your event fetching logic
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Route to get event range for admin users
router.get('/getRangeAdmin', async function(req, res) {
    try {
        const events = await db.Event.find({});  // Replace with admin-specific event logic
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin events' });
    }
});

module.exports = router;
