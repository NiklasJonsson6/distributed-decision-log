'use strict';

const fetch = require('node-fetch');
const express = require('express');
const log4js = require('log4js');

const logger = log4js.getLogger();
logger.level = 'debug';

const apps = [];
for (let i = 0; i < 3; i++) {
  const app = express();
  const port = 8080+i;
  // Assert attendance
  app.get('/', (req, res) => {
    logger.debug(`${req.socket.remoteAddress}:${req.socket.remotePort}/, ${req.ip}`);
    res.sendStatus(200);
  });
  app.listen(port, () => logger.debug(`App listening on port ${port}`));
  apps.push({port, app});
}
// const app = express();
// const port = 8080;

const main = (backendAddr) => {
  apps.forEach(app => {
    fetch(`http://${backendAddr}/here`, { method: 'POST', body: app.port.toString() })
      .then(res => {
        logger.debug(`Joined backend with port ${app.port}`);
      });
  });
};

// Assert attendance
// app.get('/', (req, res) => {
//   logger.debug(`${req.socket.remoteAddress}:${req.socket.remotePort}/, ${req.ip}`);
//   res.sendStatus(200);
// });

// app.listen(port, () => logger.debug(`App listening on port ${port}`));
main('backend');