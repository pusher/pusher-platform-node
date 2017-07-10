var express = require('express');
var bodyParser = require('body-parser');

var PusherApp = require('../lib/index').App;
var pusher = new PusherApp({
  appID: process.env.APP_ID,
  appKey: process.env.APP_KEY,
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
