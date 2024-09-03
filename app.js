require('dotenv').config();

const { getEventListeners } = require('events');
const express = require('express');
const app = express();
const port = 2554;

var db = require('./src/db'); //Require the mongoose database init

const fullcalendar = require('fullcalendar');

var passport = require('passport');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);

var store = new MongoDBStore({
  uri: process.env.DBHOST,
  collection: 'userSessions'
});

// Catch errors
store.on('error', function(error) {
  console.log(error);
});



var url = require("url");

app.set('views', __dirname + '/views');
app.set('view engine', "ejs");

app.use(express.static('public'));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: store
}));
app.use(passport.authenticate('session'));

var authRouter = require('./routes/auth');
var indexRouter = require('./routes/index');

app.use('/', authRouter);
app.use('/', indexRouter)

app.get('/newEvent/:month/:day/:year', ensureLoggedIn, (req, res) => { //Pulls open a form for a band to fill out
  res.render('newEvent',{
    month:req.params.month,
    day:req.params.day,
    year:req.params.year,
    bandName:getBandFromUsername(req.user.username)
  }
);
});

app.get('/addEvent',ensureLoggedIn, async (req,res) => { //Handles the form submitted by a band
  const data = url.parse(req.url, true).query;
  const band = new db.Band({bandName:data.bandName})
  const show = new db.Show({showDate:data.showDate,requestDate:data.reqDate,contactBand:band})
  show.showDate.setHours(15); // Set the time for the show. This is a hack and should be fixed.
  await band.save();
  await show.save();
  res.redirect("/");
});

app.get('/userDetails',ensureLoggedIn, async (req,res) => {
  console.log(req.user);
  getBandFromUsername(req.user.username);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

async function getBandFromUsername(username){
  var band = await db.Band.findOne({"loginInfo.user":username});
  return band;
}