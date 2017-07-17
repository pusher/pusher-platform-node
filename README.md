# pusher-platform-nodejs

Pusher Platform SDK for Node.js.

## Installation

Add `pusher-platform-node` to your package.json file:

```json
{
  "dependencies": {
    "pusher-platform-node": "^0.5.0"
  }
}
```

## Usage

In order to access Pusher Platform, first instantiate an Instance object.
It takes the following arguments:

```js
var pusher = require("pusher-platform-node");

var pusherPlatform = new pusher.Instance({
  instance: "",
  serviceName: "",
  serviceVersion: "",
  key: "",
});
```

`instance` is the ID that is unique to app developers' instance - they get that from the dashboard. The service SDKs will need to relay that down. Same for the `key`.
`serviceName` and `serviceVersion` should come from the service SDK itself. They can be hardcoded there. Think `feeds` and `v1`.

It is also possible to specify `host` and `port`. This will override the cluster value that is encoded in the `instance` and allow you to connect to a development or testing server.

### Authetication

Instance objects provide an `authenticate` method, which can be used in controllers
to build authentication endpoints. Authentication endpoints issue access tokens
used by Pusher Platform clients to access the API.

Make sure you authenticate the user before issuing access tokens.

- `authenticatePayload` param is essentially object of type `AuthenticatePayload`. The object must have the following format: (Please note that if you using one of our client libraries they will handle this format for you)

```js
type AuthenticatePayload {
  grant_type?: string;
  refresh_token?: string;
};
```

```js
let authenticatePayload = {
  grant_type: 'client_credentials'
};

let authOptions = {
  userId: 'zan',
  serviceClaims: {
    claim1: 'sdsdsd'
    ...
  }
};

let authResponse = app.authenticate(authenticatePayload, authOptions);
```

Where the authResponse is an object containing your access and refresh tokens:

```js
let = authResponse: {
  access_token: {
    token: 'adsasd',
    expires_id: 1000
  },
  token_type: 'bearer';
  expires_in: 20000;
  refresh_token: 'cvbccvbb'
}
```

### Request API

Instance objects provide a low-level request API, which can be used to contact Pusher Platform.

```js
pusherApp.request({
  method: "POST",
  path: "feeds/playground",
  headers: {
    "Content-Type": "application/json",
  },
  body: { items: ["test"] },
}).then(function(response) {
  console.log(response.statusCode);
  console.log(response.headers);
  return pusher.readJSON(response);
}).then(function(body) {
  console.log(body);
}).catch(function(e) {
  if (e instanceof pusher.ErrorResponse) {
    console.log(e.statusCode);
    console.log(e.headers);
    console.log(e.description);
  } else {
    console.log(e);
  }
});
```
