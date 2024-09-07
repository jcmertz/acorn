var db = require('../src/db');
var express = require('express');

var router = express.Router();

router.get('/', async (req, res) => {
    //console.log(data);
    //console.log(req.isAuthenticated());
    res.render('index',{
      isLoggedIn:req.isAuthenticated()
    });
  })
  
  module.exports = router;
  