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

In order to access Pusher Platform, first instantiate an `App` object:

```js
var pusher = require("pusher-platform");

// if auth is turned off for your app, this is all you need
var pusherApp = new pusher.App({ appId: "YOUR_APP_ID_HERE" });

// if auth is turned on, provide your app key
var pusherApp = new pusher.App({
  appId: "YOUR_APP_ID_HERE",
  authenticator: pusher.Authenticator.fromAppKey(
    "YOUR_APP_ID_HERE",
    "YOUR_APP_KEY_HERE"
  )
});
```

### Authentication (Express)

App objects provide an `authenticate` method, which can be used in controllers
to build authentication endpoints. Authentication endpoints issue access tokens
used by Pusher Platform clients to access the API.

Make sure you authenticate the user before issuing access tokens.

```js
app.post('/auth', bodyParser.urlencoded(), function(req, res) {
  pusherApp.authenticate(req, res, {
    user_id: "",
  });
});
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

Apps also provide a config request API:

```js
pusher.config_request({
  method: "GET",
  path: "keys",
});
```

## Feeds

This library provides helpers to interact with the Feeds service. First, get a `Feed` object representing one of your feeds:

```js
var donutsFeed = pusherApp.feed("donuts");
```

Currently, this library only supports publishing to a feed. (Subscriptions and history queries will be supported later.) To publish an item to your feed, run:

```
donutsFeed.publish("3 donuts for $1");
```

The `publish` method accepts any JSON-stringifiable value. Subscribers will receive the same value as the body of the published item.
