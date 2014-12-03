'use strict';

var expect = require('chai').expect;
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
