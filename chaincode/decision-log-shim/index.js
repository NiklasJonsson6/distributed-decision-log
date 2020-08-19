'use strict';

const shim = require('fabric-shim');
const Decision = require('./decision');

shim.start(new Decision());
