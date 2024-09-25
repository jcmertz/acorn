
require('dotenv').config();

const express = require('express');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const client = next({ dev });
const handle = client.getRequestHandler();
const port = 2554;

client.prepare().then(() => {
  const app = express();
  
  const http = require('http');
  const server = http.createServer(app);
  const { Server } = require("socket.io");
  const io = new Server(server);

  var db = require('./src/db'); // Mongoose database initialization
  const util = require("./src/utilities.js");
  var crypto = require('crypto');

  // Authentication and Session Management
  var passport = require('passport');
  var session = require('express-session');
  var MongoDBStore = require('connect-mongodb-session')(session);

  var store = new MongoDBStore({
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

  app.use(passport.authenticate('session'));

  // Load and connect routes
  var authRouter = require('./routes/auth');
  var indexRouter = require('./routes/index');

  // Ensure the /auth/status route is connected before other route handling
  app.use('/auth', authRouter); // Explicitly map auth routes first

  // Other routes
  app.use('/', indexRouter);

  app.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
