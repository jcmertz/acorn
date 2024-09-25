
module.exports = (handle) => {
  const express = require('express');
  const router = express.Router();

  router.get('/', (req, res) => {
    return handle(req, res);
  });

  return router;
};
