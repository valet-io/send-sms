'use strict';

var Promise = require('bluebird');
var clients = require('./clients');
var twilio  = clients.twilio;
var cache   = clients.cache;

function Pool () {
  this.numbers = {};
}

Pool.prototype.fill = function () {
  return Promise.resolve(twilio.incomincomingPhoneNumbers.list())
    .get('numbers')
    .bind(this)
    .each(function (number) {
      this.numbers[number.Sid] = number.PhoneNumber;
    })
    .return(this);
};

Pool.prototype.get = function (sid) {
  return this.numbers[sid];
};

Pool.prototype.acquire = function (toNumber) {
  return cache.getAsync('sms-mappings', toNumber)
    .get('value')
    .bind(this)
    .tap(function (sid) {
      return this.validate(sid, toNumber);
    })
    .catch(function () {
      return this.reserve(toNumber);
    })
    .then(this.get);
};

Pool.prototype.randomSid = function () {
  var sids = Object.keys(this.numbers);
  var index = sids.length * Math.random() << 0;
  return sids[index];
};

Pool.prototype.reserve = function (toNumber) {
  var sid = this.randomSid();
  return cache.putAsync('sms-mappings', toNumber, {
    value: sid
  })
  .return(sid);
};

Pool.prototype.validate = function (sid, toNumber) {
  if (this.get(sid)) return;
  return cache.delAsync('sms-mappings', toNumber)
    .throw(new Error('Number no longer in pool'));
};

module.exports = Pool;
