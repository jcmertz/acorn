var db = require('../src/db');
var express = require('express');

var router = express.Router();

router.get('/', async (req, res) => {
    var data = await getEventList();
    //console.log(data);
    //console.log(req.isAuthenticated());
    res.render('index',{
      data:data,
      isLoggedIn:req.isAuthenticated()
    });
  })
  
  module.exports = router;

  async function getEventList(){
    const events = await db.Show.find();
    // console.log("Events:");
    // console.log(events);
    return events;
  }
  