var express = require('express');
var bands = require('./bands.js');
var router = express.Router();
var passport = require('passport');
var crypto = require('crypto');
var db = require('../src/db'); //Require the mongoose database init
const util = require("../src/utilities.js");


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
        var bandRecord = await db.Band.findOne({bandName:band});
        var query = {
            showDate: {
                $gte: start,
                $lte: end
            },
            bands: { $in: [bandRecord._id] },
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
    const data = await db.Show.find(query).populate({
        path: 'bands',
        populate: {
            path: 'bandMembers',
        }
    });
    
    var events = [];
    var authenticated = req.isAuthenticated();
    
    for (const event in data){
        if(authenticated){
            //Check to see if the user is playing in a band in the show, or is the contact for the show
            function bandEval(band) {
                return band.bandMembers.some(user => user._id.toString() === req.user.id.toString());
            }
            console.log(data[event]);
            if(data[event].bands.some(bandEval) || data[event].contact.toString() === req.user.id.toString()){
                events.push({
                    title: data[event].showName,
                    start: data[event].showDate,
                    color: bands.getColorFromStatus(data[event].showStatus),
                    url: "/shows/edit/"+data[event]._id
                });
                if(data[event].showStatus >= 1){
                    events.push({
                        title: "Your Hold",
                        start: data[event].showDate,
                        allDay : true,
                        display: 'background',
                        color: bands.getColorFromStatus(data[event].showStatus)
                    });
                }
                continue;
            }
            if(data[event].showStatus == 0){
                events.push({
                    title: "Pending Requests Submitted",
                    start: data[event].showDate,
                    allDay : true,
                    display: 'background',
                    color: bands.getColorFromStatus(data[event].showStatus)
                }
            )}
            else if(data[event].showStatus == 1){
                events.push({
                    title: "Hold On Date",
                    start: data[event].showDate,
                    allDay : true,
                    display: 'background',
                    color: bands.getColorFromStatus(data[event].showStatus)
                }
            )}
        }
        if(data[event].showStatus >= 2){
            events.push({
                title: data[event].showName,
                start: data[event].showDate
            })
        }
    }
    // console.log(events);
    res.send(events);
});

router.get('/getRangeAdmin',util.checkUserRole(['staff', 'admin']), async function(req, res, next) {
    var start = req.query.start;
    var end = req.query.end;
    //console.log("Start: "+start);
    // console.log("End: "+end);
    var query = {
        showDate: {
            $gte: start,
            $lte: end
        },
    } 
    
    const data = await db.Show.find(query);
    var events = [];
    for (const event in data){
        if(data[event].showStatus >= 0){
            events.push({
                start: data[event].showDate,
                color: bands.getColorFromStatus(data[event].showStatus),
                allDay: true,
                display: 'background'
            }
        )}
        events.push({
            title: data[event].showName,
            start: data[event].showDate,
            color: bands.getColorFromStatus(data[event].showStatus),
            url: "/shows/edit/"+data[event]._id
        });
        
    }
    // console.log(events);
    res.send(events);
});

module.exports = router;