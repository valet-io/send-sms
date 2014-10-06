'use strict';

var send = require('./');

function run () {
  return send.extract()
    .tap(function (messages) {
      console.log('Retrieved %d messages', messages.length);
    })
    .then(send.transform)
    .then(send.load)
    .then(function (messages) {
      if (messages.length) {
        return run();
      }
    });
}

module.exports = run;

run();