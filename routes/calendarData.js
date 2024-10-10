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
    const data = await db.Show.find(query).populate('bands').populate('contactBand');
    var events = [];
    var authenticated = req.isAuthenticated();
    if(authenticated){
        var band = await bands.getBandFromUsername(req.user.username);
        if(band !== undefined){
            var name = band.bandName;
        }
        else{
            var name = "NO BAND NAME"
        }
    }
    for (const event in data){
        if(authenticated){
            // if(data[event].contactBand.bandName == name){
            //     events.push({
            //         title: data[event].contactBand.bandName,
            //         start: data[event].showDate,
            //         color: bands.getColorFromStatus(data[event].showStatus),
            //         url: "/shows/edit/"+data[event]._id
            //     });
            //     continue;
            // }
            const bandEval = (bandsElement) => bandsElement.bandName == name; 
            if(data[event].bands.some(bandEval)){
                events.push({
                    title: data[event].showName,
                    start: data[event].showDate,
                    color: bands.getColorFromStatus(data[event].showStatus),
                    url: "/shows/edit/"+data[event]._id
                });
                continue;
            }
            if(data[event].showStatus == 0){
                events.push({
                    title: "Pending Requests Submitted",
                    start: data[event].showDate,
                    allDay : true,
                    display: 'background',
                    color: '#ffff00'
                }
            )}
            else if(data[event].showStatus == 1){
                events.push({
                    title: "Hold",
                    start: data[event].showDate,
                    allDay : true,
                    display: 'background',
                    color: '#ff0000'
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
        }
    }
    else{
        var query = {
            showDate: {
                $gte: start,
                $lte: end
            },
        } 
    }
    const data = await db.Show.find(query);
    var events = [];
    for (const event in data){
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