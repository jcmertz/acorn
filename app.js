
require('dotenv').config();

const express = require('express');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const client = next({ dev });
const handle = client.getRequestHandler();
const port = 2554;

client.prepare().then(() => {
  const app = express();

  // Basic server setup, no custom routes for now
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
