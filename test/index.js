'use strict';

var _ = require('lodash');

var config = {
  iron: {
    token: 'ironTok',
    project_id: 'ironProj'
  },
  twilio: {
    sid: 'accSid',
    token: 'twTok'
  }
};

_.extend(require('../src/config'), config);

describe('Pipeline', function () {
  require('./pipeline');
});

describe('Pool', function () {
  require('./pool');
});

describe('Runner (Integration)', function () {
  require('./runner');
});
