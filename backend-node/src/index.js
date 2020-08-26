'use strict';

const { v4: uuidv4 } = require('uuid');
const express = require('express');
const app = express();
const port = 8080;

const enrollAdmin = require('./enroll-admin');
const submitTransaction = require('./submit-transaction');

// Client API
app.get('/startDecision', async (req, res) => {
  const transactionResponse = await submitTransaction(await enrollAdmin.enroll(), 'startDecision', uuidv4());
  app.locals.decisionId = transactionResponse.toString('utf8');
  console.log(`Decision started with id: ${app.locals.decisionId}`);
  res.sendStatus(200);
});

app.get('/here', async (req, res) => {
  if (!('decisionId' in app.locals)) {
    console.log('No decision id found, start a decision first!');
    res.sendStatus(404);
  } else {
    if (!(req.ip in app.locals)) {
      app.locals[req.ip] = uuidv4();
    }
    const clientId = app.locals[req.ip];

    await submitTransaction(await enrollAdmin.enroll(), 'here', clientId, app.locals.decisionId);
    res.sendStatus(200);
  }
});

app.get('/reserve', async (req, res) => {
  if (!('decisionId' in app.locals)) {
    console.log('No decision id found, start a decision first!');
    res.sendStatus(404);
  } else {
    if (!(req.ip in app.locals)) {
      throw new Error('reserve call from non-participating client');
    }
    const clientId = app.locals[req.ip];

    await submitTransaction(await enrollAdmin.enroll(), 'reserve', clientId, app.locals.decisionId);
    res.sendStatus(200);
  }
});

// Control/test functions
app.post('/', (req, res) => {
  if (req.ip in app.locals) {
    console.log('key in locals!');
  } else {
    app.locals[req.ip] = uuidv4();
  }
  console.log(app.locals);
  res.send();
});

app.listen(port, () => console.log(`App listening on port ${port}`));