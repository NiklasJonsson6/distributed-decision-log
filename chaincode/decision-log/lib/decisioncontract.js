'use strict';

//const { Contract, Context } = require('fabric-contract-api');
const { Contract } = require('fabric-contract-api');

//const Decision = require('./decision.js');
//const DecisionList = require('./decisionlist.js');

/*class DecisionContext extends Context {
  constructor() {
    super();
    this.decisionList = new DecisionList(this);
  }
}*/

class DecisionContract extends Contract {
  constructor() {
    super('se.yolean.decision');
  }

  /*createContext() {
    return new DecisionContext();
  }*/

  /*async instantiate(ctx) {
    console.log('Instantiate the contract');
  }*/

  /**
   * Start a new decision
   * @param {Context} ctx the transaction context
   * @param {Integer} id decision (unique) id
   * @param {String} starter_id the client that started the decision
   * @param {String} starter_name the name of the starter client
   */
  async start(ctx, id, starter_id, starter_name) {
    /*let participants = [{starter_id: starter_id, starter_name: starter_name}];
    let decision = Decision.createInstance(id, starter_id, participants);
    decision.setOngoing();
    await ctx.decisionList.addDecision(decision);
    return decision;*/
    return 'bra';
  }

  /*async end(ctx, id, starter_id) {
    let decisionKey = Decision.makeKey([id, starter_id]);
    let decision = await ctx.decisionList.getDecision(decisionKey);

    if (decision.isOngoing()) {
      decision.setOngoing();
    } else {
      throw new Error('Decision' +  id + 'is already ended');
    }
    return decision;
  }

  async join(ctx, key, participant_id, participant_name) {
    let decision = await ctx.decisionList.getDecision(key);
    decision.addParticipant({participant_id: participant_id, participant_name: participant_name});
    return decision;
  }

  async leave() {

  }

  async reserve(ctx, id) {

  }

  async queryDecision(ctx, key) {
    let decision = await ctx.decisionList.getDecision(key);
    return decision;
  }*/
}

module.exports = DecisionContract;