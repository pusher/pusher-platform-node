# pusher-platform-nodejs

Pusher Platform SDK for Node.js.

## Installation

Add `pusher-platform` to your package.json file:

```json
{
  "dependencies": {
    "pusher-platform": "^0.2.0"
  }
}
```

## Usage

In order to access Pusher Platform, first instantiate an App object:

```js
var pusher = require("pusher-platform");

var app = new pusher.App({
  cluster: "",
  app_id: "",
  app_key: "",
});
```

### Authetication

App objects provide an `authenticate` method, which can be used in controllers
to build authentication endpoints. Authentication endpoints issue access tokens
used by Pusher Platform clients to access the API.

Make sure you authenticate the user before issuing access tokens.

```js
let authOptions = {
  userId: 'zan',
  serviceClaims: {
    claim1: 'sdsdsd'
    ...
  }
}

let authResponse = app.authenticate(req, {
  userId: 'r00t',
  serviceClaims: {
    name: 'zan',
    admin: true
  }
});
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

App objects provide a low-level request API, which can be used to contact
Pusher Platform.

```js
pusherApp.request({
  method: "POST",
  path: "feeds/playground",
  headers: {
    "Content-Type": "application/json",
  },
  body: pusher.writeJSON({ items: ["test"] }),
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
