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

var pusherApp = new pusher.App({
  cluster: "",
  app_id: "",
  app_key: "",
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

### Permissions

To set permissions for specific users or feeds you can use the provided helpers.

You can add and remove `"reader"` and / or `"writer"` permissions for users of your Pusher app. There are three different roles that you set the permissions for:

- `anonymous`: if you add permissions for the `anonymous` role then this will make the action(s) (`"reader"`, `"writer"`) available for anybody, even if you haven't authenticated them
- `authenticated`: any client that has a valid token (i.e. you have provided them with a valid access token through an authentication endpoint) will be able to perform the given action
- `<userId>`: if the client making the request to read from or write to a feed has a valid token with the specified `userId` then the request will be permitted

Note that these roles form a hierarchy. For example, if you allow the `anonymous` role the `"reader"` permission for a feed called `"myFeed"` and you also want anyone with a valid token to be able to read from `"myFeed"`, then you only need to add permissions for the `anonymous` role, and the `authenticated` role will also be able to perform the read request.

Examples:

```js
// Add / remove permissions for specific userId

pusher.permissions.user('harry').add({
  myFeed: ['writer'],
  anotherFeed: ['reader', 'writer']
})

pusher.permissions.user('harry').remove({
  myFeed: ['writer'],
  anotherFeed: ['reader']
})

// Add / remove permissions for anonymous role

pusher.permissions.anonymous.add({
  myFeed: ['writer'],
  anotherFeed: ['reader', 'writer']
})

pusher.permissions.anonymous.remove({
  myFeed: ['writer']
})

// Add / remove permissions for authenticated role

pusher.permissions.authenticated.add({
  myFeed: ['writer'],
  anotherFeed: ['reader', 'writer']
})

pusher.permissions.authenticated.remove({
  myFeed: ['writer']
})

// Add / remove permissions for feeds

pusher.permissions.feed('myFeed').add({
  anonymous: ['reader'],
  users: {
    harry: ['writer']
  }
})

pusher.permissions.feed('myFeed').remove({
  anonymous: ['writer']
})

// Get permissions for users / feeds

pusher.permissions.user('harry').get()

pusher.permissions.feed('myFeed').get()

```
