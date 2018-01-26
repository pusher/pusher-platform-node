var express = require('express');
var bodyParser = require('body-parser');

var PusherPlatform = require('../target/index');

var pusher = new PusherPlatform.Instance({
  locator: 'your:instance:locator',
  key: 'your:key',
  serviceName: 'yourServiceName',
  serviceVersion: 'v1'
});

var app = express();

app.post('/', bodyParser.urlencoded(), function (req, res) {
  try {
    const data = pusher.authenticate(req.body, {});
    res.send(data);
  } catch (err) {
    res.send('AuthError: ' + err.message);
  }
});

app.listen(3000, function () {
  console.log('Pusher Auth Example listening on port 3000');
});
