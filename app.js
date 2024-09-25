
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
  var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
  var ensureLoggedIn = ensureLogIn();
  var session = require('express-session');
  var MongoDBStore = require('connect-mongodb-session')(session);

  var store = new MongoDBStore({
    uri: process.env.DBHOST,
    collection: 'userSessions'
  });

  // Catch errors from MongoDBStore
  store.on('error', function(error) {
    console.log(error);
  });

  // Uncommented: Create new admin user if none exists
  async function defaultAdmin() {
    const adminUsers = await db.User.find({ role: "admin" });
    if (!adminUsers || adminUsers.length === 0) {
      console.log("New Admin User Created:");
      console.log("Username: " + process.env.defaultAdminUser);
      console.log("Password: " + process.env.defaultAdminPassword);

      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(process.env.defaultAdminPassword, salt, 310000, 32, 'sha256', async function(err, hashedPassword) {
        if (err) { return next(err); }
        await db.User.create({
          user: process.env.defaultAdminUser,
          pass: hashedPassword.toString('hex'),
          salt: salt,
          role: "admin"
        });
      });
    }
  }

  // Uncommented: Static assets serving
  app.use(express.static('public'));

  // Session configuration
  app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: store
  }));
  app.use(passport.authenticate('session'));

  // Importing and using routes
  var authRouter = require('./routes/auth');
  var indexRouter = require('./routes/index')(handle);
  var calendarRouter = require('./routes/calendarData');

  app.use('/', authRouter);
  app.use('/', indexRouter);
  app.use('/events/', calendarRouter);

  // Next.js request handling
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Uncommented: WebSocket handling
  io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
    socket.on('message', (msg) => {
      util.logMessage(msg);
      io.emit('message:' + msg.id, msg.user + ": " + msg.message);
    });
  });

  // Server initialization
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    defaultAdmin();  // Ensure admin creation if necessary
  });

});
