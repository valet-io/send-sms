'use strict';

var config = {
  iron: {
    token: 't',
    project: 'p'
  },
  twilio: {
    sid: 's',
    token: 't'
  },
  from: '800'
};

var chai       = require('chai').use(require('sinon-chai'));
var expect     = chai.expect;
var Promise    = require('bluebird');
var sinon      = require('sinon');
var proxyquire = require('proxyquire');
var Twilio     = require('twilio');
var IronMQ     = require('iron_mq');

require('sinon-as-promised')(Promise);
sinon.spy(Twilio, 'RestClient');

var send       = proxyquire('../', {
  './config': config
});
var twilio     = Twilio.RestClient.firstCall.returnValue;

describe('send-sms', function () {

  describe('#extract', function () {

    it('gets 100 messages off the queue', function () {
      var messages = [];
      sinon.stub(IronMQ.Client.prototype, 'get').yieldsAsync(null, {
        messages: messages
      });
      return send.extract().then(function (msgs) {
        expect(msgs).to.equal(messages);
      });
    });

  });

  describe('#transform', function () {

    it('prepares a message body for Twilio', function () {
      expect(send.transform([{
        id: 1,
        body: JSON.stringify({
          to: '900',
          body: 'Hello world!'
        })
      }]))
      .to.deep.equal([{
        id: 1,
        twilio: {
          To: '900',
          From: '800',
          Body: 'Hello world!'
        }
      }]);
    });

  });

  describe('#load', function () {

    it('sends the message via Twilio and removes it from the queue', function () {
      var message = {
        To: '900',
        From: '800',
        Body: 'Hello world!'
      };
      sinon.stub(twilio, 'sendSms')
        .withArgs(message)
        .resolves({});
      sinon.stub(IronMQ.Client.prototype, 'del').yieldsAsync(null);
      return send.load([{
        id: 1,
        message: message
      }])
      .then(function () {
        expect(IronMQ.Client.prototype.del).to.have.been.calledWith(1);
      })
      .finally(function () {
        twilio.sendSms.restore();
        IronMQ.Client.prototype.del.restore();
      });
    });

    it('logs Twilio errors and continues', function () {
      var err = {};
      sinon.stub(twilio, 'sendSms')
        .rejects(err);
      sinon.stub(IronMQ.Client.prototype, 'del').yieldsAsync(null);
      sinon.stub(console, 'log');
      return send.load([{
        id: 1
      }])
      .then(function () {
        expect(console.log).to.have.been.calledWith(err);
        expect(IronMQ.Client.prototype.del).to.have.been.calledWith(1);
      })
      .finally(function () {
        console.log.restore();
      });
    });

  });

});
