const PusherPlatform = require('../target/index');

const chatkitInstance = new PusherPlatform.Instance({
  locator: 'your:instance:locator',
  key: 'your:key',
  serviceName: 'chatkit',
  serviceVersion: 'v1',
  sdkInfo: new PusherPlatform.SDKInfo({
    productName: 'chatkit',
    version: '0.0.1',
  })
});

const jwt = chatkitInstance.generateAccessToken({ su: true }).token;

chatkitInstance.request({
  jwt: jwt,
  method: 'POST',
  path: '/users',
  body: {
    id: 'ham',
    name: 'Ham Chapman',
  },
}).then((res) => {
  console.log(res);
}).catch((error) => {
  console.log(error);
})
