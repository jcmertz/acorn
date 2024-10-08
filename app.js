require('dotenv').config();

const { getEventListeners } = require('events');
const express = require('express');
const app = express();
const port = 2554;

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

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

// store.on('connected', function() {
//   console.log('MongoDB session store connected');
// });

// Catch errors
store.on('error', function(error) {
  console.error('Session store error:', error);
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

const flash = require('connect-flash');

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  store: store
}));

app.use(flash());

app.use(function(req, res, next) {
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  next();
});

//The below code is used for debugging sessions. It isn't needed generally
// app.use((req, res, next) => {
  //   console.log('Session:', req.session);
//   console.log('Session ID:', req.sessionID);
//   next();
// });

app.use(passport.initialize());
app.use(passport.authenticate('session'));


app.use(express.static('public'));
var authRouter = require('./routes/auth');
var indexRouter = require('./routes/index');
var bandRouter = require('./routes/bands');
var calendarRouter = require('./routes/calendarData');
var adminRouter = require('./routes/admin');
var showsRouter = require('./routes/shows');



app.use('/', authRouter);
app.use('/', indexRouter);
app.use('/', bandRouter.router);
app.use('/events/', calendarRouter);
app.use('/admin/', util.checkUserRole(['staff', 'admin']), adminRouter);
app.use('/shows/', showsRouter);



io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('message', (msg) => {
    util.logMessage(msg);
    io.emit('message:'+msg.id,{
      user: msg.user,
      message: msg.message
    });
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  //Create new admin user if none exists
  defaultAdmin();
})