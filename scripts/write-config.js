'use strict';

var fs = require('fs');

fs.writeFile('config.json', JSON.stringify({
  from: process.env.TWILIO_NUMBER,
  twilio: {
    sid: process.env.TWILIO_SID,
    token: process.env.TWILIO_TOKEN
  },
  iron: {
    project_id: process.env.IRON_PROJECT_ID,
    token: process.env.IRON_TOKEN
  }
}));
