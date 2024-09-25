
require('dotenv').config();

const express = require('express');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const client = next({ dev });
const handle = client.getRequestHandler();
const port = 2554;

const passport = require('passport');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

client.prepare().then(() => {
  const app = express();

  // Configure session middleware
  const store = new MongoDBStore({
    uri: process.env.DBHOST,
    collection: 'userSessions'
  });

  store.on('error', function(error) {
    console.log(error);
  });

  app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: store
  }));

  // Initialize Passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());

  var authRouter = require('./routes/auth');
  var calendarRouter = require('./routes/calendarData');

  // Use the /auth and /events routes
  app.use('/auth', authRouter);
  app.use('/events', calendarRouter);

  // Handle other routes
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
