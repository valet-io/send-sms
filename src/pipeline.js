'use strict';

var Promise  = require('bluebird');
var Pool     = require('./pool');
var clients  = require('./clients');
var twilio   = clients.twilio;
var messages = clients.messasges;
var errors   = clients.errors;

exports.prepare = function () {
  return new Pool().fill();
};

exports.extract = function () {
  return messages.getAsync({
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
  .bind(this)
  .map(function (message) {
    return this.acquire(message.body.to)
      .then(function (fromNumber) {
        message.from = fromNumber;
      })
      .return(message);
  })
  .map(function (message) {
    return {
      id: message.id,
      twilio: {
        From: message.from,
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
        return errors.postAsync(JSON.stringify({
          type: errType(err.code),
          to: message.twilio.To,
          raw: err
        }));
      })
      .catch(function (err) {
        console.log(err);
      })
      .finally(function () {
        return messages.delAsync(message.id);
      });
  });
};
