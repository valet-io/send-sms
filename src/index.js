'use strict';

var Promise = require('bluebird');
var Twilio  = require('twilio');
var IronMQ  = require('iron_mq');

var config  = require('./config');

Promise.promisifyAll(IronMQ.Client.prototype);

var twilio = new Twilio.RestClient(config.twilio.sid, config.twilio.token);
var queue = new IronMQ.Client({
  token: config.iron.token,
  project_id: config.iron.project_id,
  queue_name: 'sms-messages'
});
var errQueue = new IronMQ.Client({
  token: config.iron.token,
  project_id: config.iron.project_id,
  queue_name: 'sms-errors'
});

function handleFailed (err) {
  console.log(err);
}

exports.extract = function () {
  return queue.getAsync({
    n: 100
  });
};

exports.transform = function (messages) {
  return messages.map(function (message) {
    return {
      id: message.id,
      body: JSON.parse(message.body)
    };
  })
  .map(function (message) {
    return {
      id: message.id,
      twilio: {
        From: config.from,
        To: message.body.to,
        Body: message.body.body
      }
    };
  });
};

function is400 (err) {
  return err.status && err.status === 400;
}

function errType (code) {
  switch (code) {
    case 21211:
      return 'invalid_number';
    case 21610:
      return 'blacklist';
    default:
      return 'unknown';
  }
}

exports.load = function (messages) {
  return Promise.map(messages, function (message) {
    return Promise.resolve(twilio.sendSms(message.twilio))
      .catch(is400, function (err) {
        return errQueue.postAsync(JSON.stringify({
          type: errType(err.code),
          to: message.twilio.To,
          raw: err
        }));
      })
      .catch(function (err) {
        console.log(err);
      })
      .finally(function () {
        return queue.delAsync(message.id);
      });
  });
};
