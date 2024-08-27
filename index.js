const express = require('express');
const app = express();
const port = 2554;

const fullcalendar = require('fullcalendar');
const mongoose = require('mongoose');
async function launch(){
  await mongoose.connect('mongodb://127.0.0.1:27017/test');
};
launch;

var url = require("url");

app.set('views', __dirname + '/views');
app.set('view engine', "ejs");

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
})

app.get('/newEvent/:month/:day/:year', (req, res) => { //Pulls open a form for a band to fill out
  res.render('newEvent',{
    month:req.params.month,
    day:req.params.day,
    year:req.params.year
  }
);
});

app.get('/addEvent',(req,res) => { //Handles the form submitted by a band
  const queryObject = url.parse(req.url, true).query;
  console.log(queryObject);
  res.send("Confirmed!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
