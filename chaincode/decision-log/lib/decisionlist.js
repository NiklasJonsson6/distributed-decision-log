'use strict';

const StateList = require('../ledger-api/statelist.js');
const Decision = require('./decision.js');

class DecisionList extends StateList {
  constructor(ctx) {
    super(ctx, 'se.yolean.decisionlist');
    this.use(Decision);
  }

  async addDecision(decision) {
    return this.addState(decision);
  }

  // decisionKey hould be id:starter as defined in the constructor of Decision
  async getDecision(decisionKey) {
    return this.getState(decisionKey);
  }

  async updateDecision(decision) {
    return this.updateState(decision);
  }
}

module.exports = DecisionList;