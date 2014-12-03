'use strict';

var expect = require('chai').expect;
var nock   = require('nock');
var Pool   = require('../src/pool');

var pool;
beforeEach(function () {
  pool = new Pool();
});

it('begins with no numbers', function () {
  expect(pool.numbers).to.be.empty;
});

describe('#get', function () {

  it('gets a number by sid', function () {
    pool.numbers.sid = 'number';
    expect(pool.get('sid')).to.equal('number');
  });

});

describe('#set', function () {

  it('set a number by sid', function () {
    pool.set('sid', 'number')
    expect(pool.get('sid')).to.equal('number');
  });

});

describe('#fill', function () {

  var twilio;
  before(function () {
    twilio = nock('https://api.twilio.com');
  });
  afterEach(function () {
    twilio.done();
  });
  after(function () {
    nock.cleanAll();
  });

  it('populates the pool with numbers from Twilio', function () {
    twilio
      .get('/2010-04-01/Accounts/accSid/IncomingPhoneNumbers.json?PageSize=1000')
      .reply(200, {
        incoming_phone_numbers: [
          {
            sid: 'PN1234',
            phone_number: '+12125551234'
          },
          {
            sid: 'PN5678',
            phone_number: '+17185556789'
          }
        ]
      });
    return pool.fill()
      .then(function (pool) {
        expect(pool.get('PN1234')).to.equal('+12125551234');
        expect(pool.get('PN5678')).to.equal('+17185556789');
      });
  });

});
