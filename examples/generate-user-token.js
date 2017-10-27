var PusherPlatform = require('../target/index');

var pusher = new PusherPlatform.Instance({
  locator: 'your:instance:locator',
  key: 'your:key',
  serviceName: 'yourServiceName',
  serviceVersion: 'v1'
});

var token = pusher.generateAccessToken({ userId: 'someUserId' });

console.log(token);
