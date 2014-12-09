'use strict';

var Promise  = require('bluebird');
var pipeline = require('./pipeline');

function run () {
  return Promise.bind(this)
    .then(pipeline.extract)
    .tap(function (messages) {
      console.log('Retrieved %d messages', messages.length);
    })
    .then(pipeline.transform)
    .then(pipeline.load)
    .then(function (messages) {
      if (messages.length) {
        return run.call(this);
      }
    });
}

exports.start = function () {
  return pipeline.prepare()
    .then(function (pool) {
      return run.call(pool);
    });
    
};
