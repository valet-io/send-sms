'use strict';

var Promise = require('bluebird');
var Twilio  = require('twilio');
var IronMQ  = require('iron_mq');

var config  = require('./config');

var twilio  = new Twilio.RestClient(config.twilio.sid, config.twilio.token);
var queue   = Promise.promisifyAll(new IronMQ.Client({
  token: config.iron.token,
  project_id: config.iron.project_id,
  queue_name: 'sms-messages'
}));

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

exports.load = function (messages) {
  return Promise.map(messages, function (message) {
    return Promise.resolve(twilio.sendSms(message.twilio))
      .catch(handleFailed)
      .finally(function () {
        return queue.delAsync(message.id);
      });
  });
};
