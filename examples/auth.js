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

app.post('/', bodyParser.urlencoded({ extended: true }), function (req, res) {
  const data = pusher.authenticate(req.body, {});
  console.log(data);
  res.send(data);
});

app.listen(3000, function () {
  console.log('Pusher Auth Example listening on port 3000');
});
