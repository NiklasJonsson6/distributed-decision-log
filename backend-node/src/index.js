'use strict';

const express = require('express');
const app = express();
const port = 8080;

const enrollAdmin = require('./enrollAdmin');
const ping = require('./ping');

async function main() {
  const walletPath = await enrollAdmin.enroll();
  ping(walletPath);
}

app.get('/', (req, res) => res.send(main()));

app.listen(port, () => console.log(`App listening on port ${port}`));

main();