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
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/', function (req, res) {
  const authPayload = pusher.authenticate(req.body, {});
  console.log(authPayload);
  res.status(authPayload.status).send(authPayload.body);
});

app.listen(3000, function () {
  console.log('Pusher Auth Example listening on port 3000');
});
