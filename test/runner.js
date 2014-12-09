'use strict';

var sinon    = require('sinon');
var expect   = require('chai').use(require('sinon-chai')).expect;
var nock     = require('nock');
var qs       = require('qs');
var runner   = require('../');
var pipeline = require('../src/pipeline');
var Pool     = require('../src/pool');

var mappings, messages, twilio;
before(function () {
  mappings = nock('https://cache-aws-us-east-1.iron.io');
  messages = nock('https://mq-aws-us-east-1.iron.io');
  twilio   = nock('https://api.twilio.com');
});
afterEach(function () {
  mappings.done();
  messages.done();
  twilio.done();
});
after(function () {
  nock.cleanAll();
});

it('delivers to a given destination with the same source number', function () {
  // First we ask twilio for all our numbers
  twilio
    .get('/2010-04-01/Accounts/accSid/IncomingPhoneNumbers.json?PageSize=1000')
    .reply(200, {
      incoming_phone_numbers: [
        {
          sid: 'PN1234',
          phone_number: '+12125551234'
        }
      ]
    });
  // Next we ask IronMQ for up to 100 queued SMS messages
  messages
    .get('/1/projects/ironProj/queues/sms-messages/messages?n=100')
    .reply(200, {
      messages: [{
        id: 1,
        body: JSON.stringify({
          to: '+17185551234',
          body: 'Hello!'
        })
      }]
    });
  // We get one messages and check the cache for an SID of a from number
  mappings
    .get('/1/projects/ironProj/caches/sms-mappings/items/%2B17185551234?oauth=ironTok')
    .reply(200, {
      cache: 'sms-mappings',
      value: 'PN1234'
    });
  twilio
    .post('/2010-04-01/Accounts/accSid/SMS/Messages.json', qs.stringify({
      From: '+12125551234',
      To: '+17185551234',
      Body: 'Hello!'
    }))
    .reply(201, {});
  // the messages is sent successfully so we delete it from IronMQ
  messages
    .delete('/1/projects/ironProj/queues/sms-messages/messages/1')
    .reply(200, {
      msg: 'Deleted.'
    });
  // the runner will check for more messages and find none
  messages
    .get('/1/projects/ironProj/queues/sms-messages/messages?n=100')
    .reply(200, {
      messages: []
    });
  sinon.spy(pipeline, 'extract')
  return runner.start()
    .then(function () {
      expect(pipeline.extract).to.have.been.calledTwice;
      expect(pipeline.extract).to.have.always.been.calledOn(sinon.match.instanceOf(Pool));
    });
});
