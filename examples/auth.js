var express = require('express');
var bodyParser = require('body-parser');

var PusherService = require('../lib/index').Service;
var pusher = new PusherService({
  serviceId: process.env.SERVICE_ID,
  serviceKey: process.env.SERVICE_KEY,
});

var app = express();

app.post('/', bodyParser.urlencoded(), function (req, res) {
  try {
    const data = pusher.authenticate(req, {})
    res.send(data);
  } catch (err) {
    res.send('AuthError: ' + err.message);
  }
});

app.listen(3000, function () {
  console.log('Pusher Auth Example listening on port 3000');
});
