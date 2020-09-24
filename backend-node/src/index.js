'use strict';

const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.text());
const port = 8080;

const enrollAdmin = require('./enroll-admin');
const submitTransaction = require('./submit-transaction');

const decisionProcess = async (walletPath) => {
  let promises = [];
  // Pending phase
  console.log('Start of pending phase, joining all clients to the decision: ' + JSON.stringify(app.locals.clients.map(c => c.ip)));
  app.locals.clients.forEach((c) => {
    promises.push(fetch(`http://${c.ip}`)
      .then((res) => {
        if (res.ok) {
          // invoke join
          //console.log(`Client ${c.ip} joins the decision`);
          return submitTransaction(walletPath, 'join', c.uuid, app.locals.decisionId);
        } else {
          // remove client from array
          console.log(`Client ${c.ip} did not respond (pending) and is removed from the client list`);
          app.locals.clients = app.locals.client.filter(cl => cl.uuid !== c.uuid);
        }
      }));
  });
  // wait for all clients to respond or time out
  await Promise.allSettled(promises);
  console.log('All promises from pending phase settled, start of ongoing phase');
  // Ongoing phase
  if (await submitTransaction(walletPath, 'setOngoing', app.locals.decisionId) === '"success"') {
    console.log('Decision state succesfully set to ongoing, fetching clients');
    promises = [];
    app.locals.clients.forEach(async (c) => {
      promises.push(fetch(`http://${c.ip}`)
        .then((res) => {
          if (res.ok) {
            // invoke here
            //console.log(`Client ${c.ip} asserts its attendance`);
            return submitTransaction(walletPath, 'here', c.uuid, app.locals.decisionId);
          } else {
            // remove client from array
            console.log(`Client ${c.ip} did not respond (ongoing) and is removed from the client list`);
            app.locals.clients = app.locals.client.filter(cl => cl.uuid !== c.uuid);
          }
        }));
    });
    // Wait for timer
    // ....
    // Wait for responses
    await Promise.allSettled(promises);
    console.log('All promises from ongoing phase settled, start of ended phase');
  } else {
    // Some nice error... or maybe it's thrown from submitTransaction already
    throw new Error();
  }
  // Ended phase
  if (await submitTransaction(walletPath, 'setEnded', app.locals.decisionId) === '"success"') {
    console.log('Decision state succesfully set to ended, fetching clients');
    promises = [];
    app.locals.clients.forEach(c => {
      promises.push(fetch(`http://${c.ip}`)
        .then((res) => {
          if (res.ok) {
            // invoke here
            //console.log(`Client ${c.ip} asserts its attendance`);
            return submitTransaction(walletPath, 'here', c.uuid, app.locals.decisionId);
          } else {
            // remove client from array
            console.log(`Client ${c.ip} did not respond (ongoing) and is removed from the client list`);
            app.locals.clients = app.locals.client.filter(cl => cl.uuid !== c.uuid);
          }
        }));
    });
    // Wait for timer
    // ...
    // Wait for responses
    await Promise.allSettled(promises);
    console.log('All promises from ended phase settled');
  } else {
    // Some nice error... or maybe it's thrown from submitTransaction already
    throw new Error();
  }
};

// Client API
app.get('/startDecision', async (req, res) => {
  // Response time
  const startTime = process.hrtime();
  // const startTime = process.hrtime();
  //   let endTime = process.hrtime();
  //   fetch(`http://${backendAddr}/startDecision`)
  //     .then(res => {
  //       endTime = process.hrtime(startTime);
  //       logger.debug('Overhead time (hr): %ds %dms', endTime[0], endTime[1] / 1000000);
  //     }).then(() => {
  //       res.send(`Overhead time (hr): ${endTime[0]} ${endTime[1] / 1000000}`);
  //     });
  const transactionResponse = await submitTransaction(await enrollAdmin.enroll(), 'startDecision', uuidv4());
  const endTime = process.hrtime(startTime);
  app.locals.decisionId = transactionResponse;
  console.log(`Decision started with id: ${app.locals.decisionId}`);

  // Overhead
  try {
    await decisionProcess(await enrollAdmin.enroll());
    res.send(`: ${endTime[0]}s ${endTime[1] / 1000000}ms`);
  } catch (error) {
    res.status(400).send(`Error: ${error.stack}`);
  }
});

app.post('/here', async (req, res) => {
  // Create 'clients' array
  const clientIP = req.ip.substring(7) + ':' + req.body;
  //console.log(`Client ${clientIP} connected`);
  if (!('clients' in app.locals)) {
    app.locals.clients = [];
  }
  // Add the client to the list if not already added, otherwise just respond 'ok'
  if (app.locals.clients.length === 0 || app.locals.clients.every(c => !(c.ip === clientIP))) {
    app.locals.clients.push({ip: clientIP, uuid: uuidv4()});
  }
  //console.log(JSON.stringify(app.locals.clients));
  res.sendStatus(200);
});

app.get('/reserve', async (req, res) => {
  if (!('decisionId' in app.locals)) {
    console.log('No decision id found, start a decision first!');
    res.sendStatus(404);
  } else {
    if (!(req.ip in app.locals)) {
      throw new Error('reserve call from non-participating client');
    }
    const clientId = app.locals.find(c => c.ip === req.ip);

    try {
      // Should throw if decision status is wrong
      await submitTransaction(await enrollAdmin.enroll(), 'reserve', clientId, app.locals.decisionId);
      res.sendStatus(200);
    } catch (error) {
      res.sendStatus(403);
    }
  }
});

// Control/test functions
app.get('/process', async (req, res) => {
  decisionProcess(await enrollAdmin.enroll());
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  // fetch('http://172.19.0.1:8080')
  //   .then(res => res.text())
  //   .then(body => console.log(body));
  app.locals.clients = [];
  res.sendStatus(200);
});

app.get('/test', async (req, res) => {
  //console.log(req.headers['x-forwarded-for'] || req.socket.remoteAddress);
  console.log(`${req.socket.remoteAddress}:${req.socket.remotePort}/, ${req.ip}`);
  await submitTransaction(await enrollAdmin.enroll(), 'ping');
  res.sendStatus(200);
});

app.listen(port, () => console.log(`App listening on port ${port}`));