'use strict';

const Decision = require('../decision');
const ChaincodeMockStub = require('@theledger/fabric-mock-stub').ChaincodeMockStub;
const Transform = require('@theledger/fabric-mock-stub').Transform;
const expect = require('chai').expect;

const decision = new Decision();

describe('Test Chaincode', () => {
  it('Should init', async () => {
    const stub = new ChaincodeMockStub('MockStub', decision);
    const response = await stub.mockInit('id1', []);
    expect(response.status).to.eql(200);
  });

  it('Should work...', async () => {
    // Simply test if the transactions go through, the actual response should not matter in most cases
    const stub = new ChaincodeMockStub('MockStub', decision);
    const response = await stub.mockInvoke('tx1', ['startDecision', 'decision_id0']);
    expect(Transform.bufferToObject(response.payload)).to.deep.eql('decision_id0');

    // query
    const resp_query = await stub.mockInvoke('tx2', ['queryDecision', 'decision_id0']);
    expect(resp_query.status).to.eql(200);

    // join
    const resp_join = await stub.mockInvoke('tx3', ['join', 'client_id1', 'decision_id0']);
    expect(resp_join.status).to.eql(200);

    // setOngoing
    const resp_setOngoing = await stub.mockInvoke('tx4', ['setOngoing', 'decision_id0']);
    expect(resp_setOngoing.status).to.eql(200);

    // here
    const resp_here = await stub.mockInvoke('tx5', ['here', 'client_id1', 'decision_id0']);
    expect(resp_here.status).to.eql(200);

    // setEnded
    const resp_setEnded = await stub.mockInvoke('tx4', ['setEnded', 'decision_id0']);
    expect(resp_setEnded.status).to.eql(200);

    // here2
    const resp_here2 = await stub.mockInvoke('tx5', ['here', 'client_id1', 'decision_id0']);
    expect(resp_here2.status).to.eql(200);
  });
});