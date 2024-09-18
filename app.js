require('dotenv').config();

const { getEventListeners } = require('events');
const express = require('express');
const app = express();
const port = 2554;

var db = require('./src/db'); //Require the mongoose database init

const fullcalendar = require('fullcalendar');
const util = require("./src/utilities.js");

var crypto = require('crypto');

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

//Create new admin user if none exists
async function defaultAdmin() {
  const adminUsers = await db.User.find({role:"admin"});
  if(adminUsers === 'undefined' || adminUsers.length == 0){
    console.log("New Admin User Created:");
    console.log("Username: " + process.env.defaultAdminUser);
    console.log("Password: " + process.env.defaultAdminPassword);
    
    const salt = crypto.randomBytes(16).toString('hex'); // Convert salt to hexadecimal
    crypto.pbkdf2(process.env.defaultAdminPassword, salt, 310000, 32, 'sha256', async function(err, hashedPassword) {
      if (err) { return next(err); }
      const user = await db.User.create({
        user: process.env.defaultAdminUser,
        pass: hashedPassword.toString('hex'), 

        salt: salt,
        role: "admin"
      });
    });
  }
}


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
  console.log(`Example app listening on port ${port}`);
  //Create new admin user if none exists
  defaultAdmin();
})


