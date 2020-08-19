'use strict';

const State = require('./../ledger-api/state.js');

const decisionState = {
  ONGOING: 1,
  ENDED: 2
};

class Decision extends State {
  constructor(obj) {
    super(Decision.getClass(), [obj.id, obj.starter_id]);
    Object.assign(this, obj);
  }

  // getters / setters
  setOngoing() {
    this.currentState = decisionState.ONGOING;
  }
  setEnded() {
    this.currentState = decisionState.ENDED;
  }
  isOngoing() {
    return this.currentState === decisionState.ONGOING;
  }
  isEnded() {
    return this.currentState === decisionState.ENDED;
  }
  getStarter() {
    return this.starter;
  }
  setStarter(starter) {
    this.starter = starter;
  }
  getParticipants() {
    return this.participants;
  }
  setParticipants(participants) {
    this.participants = participants;
  }
  addParticipant(participant) {
    this.participants.push(participant);
  }
  removeParticipant(participant) {
    this.participants.splice(this.participants.findIndex(p => p === participant), 1);
  }

  static fromBuffer(buffer) {
    return Decision.deserialize(buffer);
  }

  toBuffer() {
    return Buffer.from(JSON.stringify(this));
  }

  /**
   * Deserialize a state data to decision
   * @param {Buffer} data to form back into the object
   */
  static deserialize(data) {
    return State.deserializeClass(data, Decision);
  }

  static createInstance(id, starter_id, participants) {
    return new Decision({ id, starter_id, participants });
  }

  static getClass() {
    return 'se.yolean.decision';
  }
}

module.exports = Decision;