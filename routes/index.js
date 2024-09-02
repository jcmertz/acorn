var db = require('../src/db');
var express = require('express');

var router = express.Router();

router.get('/', async (req, res) => {
    var data = await getEventList();
    //console.log(data);
    res.render('index',{
      data:data
    });
  })
  
  module.exports = router;

  async function getEventList(){
    const events = await db.Show.find();
    // console.log("Events:");
    // console.log(events);
    return events;
  }
  