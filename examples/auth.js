var express = require('express');
var bodyParser = require('body-parser');

var PusherApp = require('../lib/index').App;
var pusherApp = new PusherApp({
  appId: process.env.APP_ID,
  authenticator: pusher.Authenticator.fromAppKey(
    process.env.APP_ID,
    process.env.APP_KEY
  )
});

var expressApp = express();

expressApp.post('/', bodyParser.urlencoded(), function (req, res) {
  pusherApp.authenticate(req, res, {});
});

expressApp.listen(3000, function () {
  console.log('Pusher Auth Example listening on port 3000');
});
