'use strict';

var Promise   = require('bluebird');
var IronMQ    = require('iron_mq');
var Twilio    = require('twilio');
var ironCache = require('iron-cache');
var config    = require('./config');

Promise.promisifyAll(IronMQ.Client.prototype);

exports.twilio = new Twilio.RestClient(config.twilio.sid, config.twilio.token);

exports.messages = new IronMQ.Client({
  token: config.iron.token,
  project_id: config.iron.project_id,
  queue_name: 'sms-messages'
});

exports.errors = new IronMQ.Client({
  token: config.iron.token,
  project_id: config.iron.project_id,
  queue_name: 'sms-errors'
});

exports.cache = Promise.promisifyAll(ironCache.createClient({
  project: config.iron.project_id,
  token: config.iron.token
}));
