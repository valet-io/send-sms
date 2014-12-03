'use strict';

var _ = require('lodash');

var config = {
  iron: {
    token: 't',
    project_id: 'p'
  },
  twilio: {
    sid: 's',
    token: 't'
  },
  from: '800'
};

_.extend(require('../src/config'), config);

describe('Runner', function () {
  // require('./runner');
});

describe('Pool', function () {
  require('./pool');
});

// var chai       = require('chai').use(require('sinon-chai'));
// var expect     = chai.expect;
// var Promise    = require('bluebird');
// var sinon      = require('sinon');
// var proxyquire = require('proxyquire');
// var Twilio     = require('twilio');
// var IronMQ     = require('iron_mq');

// require('sinon-as-promised')(Promise);
// sinon.spy(Twilio, 'RestClient');

// var send       = proxyquire('../', {
//   './config': config
// });
// var twilio     = Twilio.RestClient.firstCall.returnValue;

// describe('send-sms', function () {

//   describe('#extract', function () {

//     it('gets 100 messages off the queue', function () {
//       var messages = [];
//       sinon.stub(IronMQ.Client.prototype, 'get').yieldsAsync(null, messages);
//       return send.extract().then(function (msgs) {
//         expect(msgs).to.equal(messages);
//       });
//     });

//   });

//   describe('#transform', function () {

//     it('prepares a message body for Twilio', function () {
//       expect(send.transform([{
//         id: 1,
//         body: JSON.stringify({
//           to: '900',
//           body: 'Hello world!'
//         })
//       }]))
//       .to.deep.equal([{
//         id: 1,
//         twilio: {
//           To: '900',
//           From: '800',
//           Body: 'Hello world!'
//         }
//       }]);
//     });

//   });

//   describe('#load', function () {

//     var message = {
//       To: '900',
//       From: '800',
//       Body: 'Hello world!'
//     };

//     beforeEach(function () {
//       sinon.stub(IronMQ.Client.prototype, 'del').yieldsAsync(null);
//       sinon.stub(IronMQ.Client.prototype, 'post').yieldsAsync(null);
//       sinon.stub(twilio, 'sendSms');
//     });

//     afterEach(function () {
//       IronMQ.Client.prototype.del.restore();
//       IronMQ.Client.prototype.post.restore();
//       twilio.sendSms.restore();
//     });

//     it('sends the message via Twilio', function () {
//       twilio.sendSms
//         .withArgs(message)
//         .resolves({});
//       return send.load([{
//         id: 1,
//         twilio: message
//       }])
//       .then(function () {
//         expect(twilio.sendSms).to.have.been.calledWith(message);
//       });
//     });

//     it('deletes the message off the queue', function () {
//       twilio.sendSms
//         .withArgs(message)
//         .resolves({});
//       return send.load([{
//         id: 1,
//         twilio: message
//       }])
//       .then(function () {
//         expect(IronMQ.Client.prototype.del)
//           .to.have.been.calledWith(1);
//       });
//     });

//     it('logs invalid number errors to a queue', function () {
//       var err = new Error();
//       err.status = 400;
//       err.code = 21211;
//       twilio.sendSms
//         .withArgs(message)
//         .rejects(err);
//       return send.load([{
//         id: 1,
//         twilio: message
//       }])
//       .then(function () {
//         expect(IronMQ.Client.prototype.post).to.have.been.calledWith(JSON.stringify({
//           type: 'invalid_number',
//           to: '900',
//           raw: err
//         }));
//       });
//     });

//     it('logs blacklist errors to a queue', function () {
//       var err = new Error();
//       err.status = 400;
//       err.code = 21610;
//       twilio.sendSms
//         .withArgs(message)
//         .rejects(err);
//       return send.load([{
//         id: 1,
//         twilio: message
//       }])
//       .then(function () {
//         expect(IronMQ.Client.prototype.post).to.have.been.calledWith(JSON.stringify({
//           type: 'blacklist',
//           to: '900',
//           raw: err
//         }));
//       });
//     });

//     it('logs other errors', function () {
//       var err = new Error();
//       twilio.sendSms
//         .rejects(err);
//       sinon.stub(console, 'log');
//       return send.load([{
//         id: 1
//       }])
//       .then(function () {
//         expect(console.log).to.have.been.calledWith(err);
//       })
//       .finally(function () {
//         console.log.restore();
//       });
//     });

//   });

// });
