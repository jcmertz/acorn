var express = require('express');
var bands = require('./bands.js');
var router = express.Router();
var passport = require('passport');
var crypto = require('crypto');
var db = require('../src/db'); //Require the mongoose database init

var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();

var url = require("url");

router.use(express.urlencoded({ extended: true }));


router.get('/getRange', async function(req, res, next) {
    var start = req.query.start;
    var end = req.query.end;
    var band = req.query.band;
    //console.log("Start: "+start);
    // console.log("End: "+end);
    if(band !== undefined){
        var query = {
            showDate: {
                $gte: start,
                $lte: end
            },
            'contactBand.bandName':band,
            showStatus: {$gte: 0}
        }
    }
    else{
        var query = {
            showDate: {
                $gte: start,
                $lte: end
            },
            showStatus: {$gte: 0}
        } 
    }
    const data = await db.Show.find(query);
    var events = [];
    for (const event in data){
        if(req.isAuthenticated()){
            var band = await bands.getBandFromUsername(req.user.username);
            var name = band.bandName;
            if(data[event].contactBand.bandName == name){
                events.push({
                    title: data[event].contactBand.bandName,
                    start: data[event].showDate
                });
                continue;
            }
            if(data[event].showStatus == 0){
                events.push({
                    start: data[event].showDate,
                    allDay : true,
                    display: 'background',
                    color: '#ffff00'
                }
            )}
            else if(data[event].showStatus == 1){
                events.push({
                    start: data[event].showDate,
                    allDay : true,
                    display: 'background',
                    color: '#ff0000'
                }
            )}
        }
        if(data[event].showStatus >= 2){
            events.push({
                title: data[event].contactBand.bandName,
                start: data[event].showDate
            })
        }
    }
    console.log(events);
    res.send(events);
});

module.exports = router;