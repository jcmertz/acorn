require('dotenv').config();

const { getEventListeners } = require('events');
const express = require('express');
const app = express();
const port = 2554;

var db = require('./src/db'); //Require the mongoose database init

const fullcalendar = require('fullcalendar');
const util = require("./src/utilities.js");

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
var bandRouter = require('./routes/bands');
var calendarRouter = require('./routes/calendarData');
var adminRouter = require('./routes/admin');


app.use('/', authRouter);
app.use('/', indexRouter);
app.use('/', bandRouter.router);
app.use('/events/', calendarRouter);
app.use('/admin/', util.checkUserRole(['staff', 'admin']), adminRouter);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

