'use strict';

const fetch = require('node-fetch');
const express = require('express');
const log4js = require('log4js');

const logger = log4js.getLogger();
logger.level = 'debug';
const scaleTo = 100;
const scaleFrom = 9;
const stepSize = 10;
const iterations = 3;
const backendAddr = 'backend';

const apps = [];
for (let i = 0; i < scaleTo; i++) {
  const app = express();
  const port = 8080+i;
  // Assert attendance
  app.get('/', (req, res) => {
    // logger.debug('Asserting attendance');
    res.sendStatus(200);
  });
  // Start a decision and measure overhead (currently no time to act)
  app.get('/startDecision', (req, res) => {
    logger.debug('Starting decision and measuring overhead');
    const startTime = process.hrtime();
    let endTime = process.hrtime();
    let responseTime = '';
    fetch(`http://${backendAddr}/startDecision`)
      .then(async (res) => {
        endTime = process.hrtime(startTime);
        responseTime = await res.text();
        logger.debug('Response time: %d, Overhead time (hr): %ds %dms', res, endTime[0], endTime[1] / 1000000);
      }).then(() => {
        res.send(`Response time${responseTime}, Overhead time (hr): ${endTime[0]}s ${endTime[1] / 1000000}ms`);
      });
  });

  app.listen(port, () => logger.debug(`App listening on port ${port}`));
  apps.push({port, app});
}

apps[0].app.get('/measure', async (req, res) => {
  logger.debug('Starting tests');
  res.sendStatus(200);
  let results = [];
  // Run at each scale ten times
  for (let upscale = scaleFrom; upscale < scaleTo; upscale += stepSize) {
    // Join clients
    for (let c = 0; c < upscale; c++) {
      let app = apps[c];
      await fetch(`http://${backendAddr}/here`, { method: 'POST', body: app.port.toString() });
    }
    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime();
      let endTime = process.hrtime();
      //let responseTime = '';
      await fetch(`http://${backendAddr}/startDecision`)
        .then(async (res) => {
          endTime = process.hrtime(startTime);
          //responseTime = await res.text();
          results.push({Scale: upscale, Ovh: `${endTime[0]}.${Math.round(endTime[1] / 1000000)}s`});
          logger.debug(`Scale ${upscale}, iteration ${i}`);
        });
    }
  }
  // Clear backend's client list
  await fetch(`http://${backendAddr}/`);
  results.forEach(res => {
    logger.info(JSON.stringify(res));
  });
});
// const app = express();
// const port = 8080;

// const main = () => {
//   apps.forEach(app => {
//     fetch(`http://${backendAddr}/here`, { method: 'POST', body: app.port.toString() })
//       .then(res => {
//         logger.debug(`Joined backend with port ${app.port}`);
//       });
//   });
// };

// // Assert attendance
// // app.get('/', (req, res) => {
// //   logger.debug(`${req.socket.remoteAddress}:${req.socket.remotePort}/, ${req.ip}`);
// //   res.sendStatus(200);
// // });

// // app.listen(port, () => logger.debug(`App listening on port ${port}`));
// main();