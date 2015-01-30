'use strict';

var pipeline = require('../src/pipeline');
var clients  = require('../src/clients');
var Pool     = require('../src/pool');
var sinon    = require('sinon');
var expect   = require('chai').use(require('sinon-chai')).expect;

require('sinon-as-promised');

var sandbox;
beforeEach(function () {
  sandbox = sinon.sandbox.create();
});
afterEach(function () {
  sandbox.restore();
});

describe('#extract', function () {

  it('gets 100 messages off the queue', function () {
    var messages = [];
    sandbox.stub(clients.messages, 'getAsync').resolves(messages);
    return pipeline.extract().then(function (msgs) {
      expect(msgs).to.equal(messages);
    });
  });

});

describe('#transform', function () {

  it('prepares the twilio request body', function () {
    return pipeline.transform.call({
      acquire: sinon.stub()
        .withArgs('toNumber')
        .resolves('fromNumber')
    },
    [{
      id: 1,
      body: JSON.stringify({
        to: 'toNumber',
        body: 'Hello world!'
      })
    }])
    .then(function (transformed) {
      expect(transformed).to.deep.equal([{
        id: 1,
        twilio: {
          To: 'toNumber',
          From: 'fromNumber',
          Body: 'Hello world!'
        }
      }]);
    });
  });

});

describe('#load', function () {

  var message = {
    To: '900',
    From: '800',
    Body: 'Hello world!'
  };

  beforeEach(function () {
    sandbox.stub(clients.messages, 'delAsync').resolves();
    sandbox.stub(clients.errors, 'postAsync').resolves();
    sandbox.stub(clients.twilio, 'sendSms');
  });

  it('sends the message via Twilio', function () {
    clients.twilio.sendSms
      .withArgs(message)
      .resolves({});
    return pipeline.load([{
      id: 1,
      twilio: message
    }])
    .then(function () {
      expect(clients.twilio.sendSms).to.have.been.calledWith(message);
    });
  });

  it('deletes the message off the queue', function () {
    clients.twilio.sendSms
      .withArgs(message)
      .resolves({});
    return pipeline.load([{
      id: 1,
      twilio: message
    }])
    .then(function () {
      expect(clients.messages.delAsync)
        .to.have.been.calledWith(1);
    });
  });

  it('logs invalid number errors to a queue', function () {
    var err = new Error();
    err.status = 400;
    err.code = 21211;
    clients.twilio.sendSms
      .withArgs(message)
      .rejects(err);
    return pipeline.load([{
      id: 1,
      twilio: message
    }])
    .then(function () {
      expect(clients.errors.postAsync).to.have.been.calledWith(JSON.stringify({
        type: 'invalid_number',
        to: '900',
        raw: err
      }));
    });
  });

  it('logs blacklist errors to a queue', function () {
    var err = new Error();
    err.status = 400;
    err.code = 21610;
    clients.twilio.sendSms
      .withArgs(message)
      .rejects(err);
    return pipeline.load([{
      id: 1,
      twilio: message
    }])
    .then(function () {
      expect(clients.errors.postAsync).to.have.been.calledWith(JSON.stringify({
        type: 'blacklist',
        to: '900',
        raw: err
      }));
    });
  });

  it('logs unknown twilio error codes to a queue', function () {
    var err = new Error();
    err.status = 400;
    err.code = 42;
    clients.twilio.sendSms
      .withArgs(message)
      .rejects(err);
    return pipeline.load([{
      id: 1,
      twilio: message
    }])
    .then(function () {
      expect(clients.errors.postAsync).to.have.been.calledWith(JSON.stringify({
        type: 'unknown',
        to: '900',
        raw: err
      }));
    });
  });

  it('logs other errors', function () {
    var err = new Error();
    clients.twilio.sendSms
      .rejects(err);
    sandbox.stub(console, 'error');
    return pipeline.load([{
      id: 1
    }])
    .then(function () {
      expect(console.error).to.have.been.calledWith(err);
    });
  });

});
