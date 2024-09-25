
require('dotenv').config();

const express = require('express');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const client = next({ dev });
const handle = client.getRequestHandler();
const port = 2554;

client.prepare().then(() => {
  const app = express();

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
