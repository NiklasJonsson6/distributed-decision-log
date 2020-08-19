'use strict';

const Decision = require('../decision');
const ChaincodeMockStub = require('@theledger/fabric-mock-stub').ChaincodeMockStub;
const expect = require('chai').expect;

const decision = new Decision();

describe('Test Chaincode', () => {
  it('Should init', async () => {
    const stub = new ChaincodeMockStub('MockStub', decision);
    const response = await stub.mockInit('id1', []);
    expect(response.status).to.eql(200);
  });

  it('Should return the nubmer of assets', async () => {
    const stub = new ChaincodeMockStub('MockStub', decision);
    const response = await stub.mockInvoke('tx2', ['startDecision']);
    expect(response.status).to.eql(200);
  });
});