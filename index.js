const { getEventListeners } = require('events');
const express = require('express');
const app = express();
const port = 2554;

const fullcalendar = require('fullcalendar');
const mongoose = require('mongoose');

mongoose.connect('mongodb://acorn-mongo:27017/test');

const bandSchema = new mongoose.Schema({
  bandName: String,
  contactEmail: String,
  instagram: String,
  genre: String,
});
const showSchema = new mongoose.Schema({
  showDate: Date,
  requestDate: Date,
  bands: [bandSchema],
  contactBand: bandSchema,
  matinee:Boolean,
  ticketPrice:Number,
  ticketsSold:Number,
  showStatus:Number
});

const Band = mongoose.model('Band',bandSchema);
const Show = mongoose.model('Show',showSchema);

var url = require("url");

app.set('views', __dirname + '/views');
app.set('view engine', "ejs");

app.use(express.static('public'));

app.get('/', async (req, res) => {
  var data = await getEventList();
  console.log("TEST");
  console.log(data);
  res.render('index',{
    data:data
  });
})

app.get('/newEvent/:month/:day/:year', (req, res) => { //Pulls open a form for a band to fill out
  res.render('newEvent',{
    month:req.params.month,
    day:req.params.day,
    year:req.params.year
  }
);
});

app.get('/addEvent',async (req,res) => { //Handles the form submitted by a band
  const data = url.parse(req.url, true).query;
  const band = new Band({bandName:data.bandName})
  const show = new Show({showDate:data.showDate,requestDate:data.reqDate,contactBand:band})
  await band.save();
  await show.save();
  console.log(data);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

async function getEventList(){
  const events = await Show.find();
  // console.log("Events:");
  // console.log(events);
  return events;
}