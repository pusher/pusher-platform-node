# pusher-platform-authorizer-nodejs

This repository provides an "auth server" for apps using Pusher Platform. An auth server is a HTTP server which you run, and which lets your users' devices securely access Pusher services on the user's behalf. The auth server accepts HTTP requests which include a suitable proof of identity, and responds with tokens which the user's device can pass to Pusher Platform services.


## Quickstart

First, edit `main.js` to implement the function `authorizeRequest`, as described below. Next, run the following:

```bash
npm install
export PUSHER_PLATFORM_APP_ID=YOUR_APP_ID           # Get this from your dashboard at https://dash.pusher.com/
export PUSHER_PLATFORM_ISSUER_KEY=YOUR_ISSUER_KEY   # Get this from your dashboard at https://dash.pusher.com/
export PUSHER_PLATFORM_SECRET_KEY=YOUR_SECRET_KEY   # Get this from your dashboard at https://dash.pusher.com/
export PUSHER_PLATFORM_REFRESH_SECRET_KEY=          # You could set this to the same as PUSHER_PLATFORM_SECRET_KEY
node main.js
```

Notes:

* the machine must have an accurate system clock


## What does this server do?

When run, this program starts an HTTP server on port 3000 and accepts POST requests to `/pusherplatform/authorize`. The HTTP response is `application/json` with the following schema:

```js
{
  "token_type": "bearer",  // FIXME What else could this be? Why?
  "expires_in": Number,    // FIXME Is this necessary? Isn't it a readable part of the access_token?
  "access_token": JwtString
}
```

The `access_token` can be used to authenticate against Pusher Platform services by including it in requests as the header `Authorization: Bearer MY_ACCESS_TOKEN`. The access token includes a `user_id` identifying a user in your user database (for example, it could be an email address).

The `user_id` identifies the user that made the request for an access token. The server will only issue the token if it can determine that the request really did come from this user. This is your job: you must provide a method to determine which user the request is from. For example, your system could use an HTTP cookie to track user sessions. You must provide this as the function `authorizeRequest` in `main.js`.

The access token is signed with your app's secret key. You must get these details from [your dashboard](https://dash.pusher.com/) and provide them to this server as environment variables:

```bash
export PUSHER_PLATFORM_APP_ID=YOUR_APP_ID           # Get this from your dashboard at https://dash.pusher.com/
export PUSHER_PLATFORM_ISSUER_KEY=YOUR_ISSUER_KEY   # Get this from your dashboard at https://dash.pusher.com/
export PUSHER_PLATFORM_SECRET_KEY=YOUR_SECRET_KEY   # Get this from your dashboard at https://dash.pusher.com/
```

The `access_token` in the response is a JSON string. It is a [JSON Web Token](https://jwt.io/) signed using `PUSHER_PLATFORM_SECRET_KEY` and HMAC-SHA256. The _claims_ in the JWT look like:

```js
{
  "iat": current_time,
  "exp": current_time + ONE_DAY,      // Pusher will refuse this token after this time, and verify that `exp - iat = 24 hours`
  "iss": PUSHER_PLATFORM_ISSUER_KEY,  // Identifies the secret you used to sign the JWT
  "app": PUSHER_PLATFORM_APP_ID,
  "sub": user_id                      // The user_id identified by your `authorizeRequest` function
}
```

The access token is only valid for 24 hours after it is issued. If a device wants to continue accessing Pusher services after this time, it must obtain a new access token. One way it can do this is to call the `/pusherplatform/authorize` endpoint again, which will hand out new tokens whenever asked. Another way is to use the "refresh token" feature of this auth server, which is described in the next section.


## Optional feature: refresh tokens

This auth server has an alternative mechanism to extend the 24-hour access token window: "refresh tokens". This mechanism provides an additional "refresh token" to the device, alongside the access token in the HTTP response. The refresh token contains the same `user_id` and is recognized by this auth server as an alternative proof of identity (that is, an alternative to your chosen authentication mechanism), resulting in a new access token and new refresh token. The refresh token has a two-week expiry, but, due to the refresh mechanism, it has an unbounded lifetime because it can be continually refreshed. The refresh token is not recognized by Pusher services, and should only be sent back to this auth server.

TODO EXPLAIN THE THEORETICAL ADVANTAGES OF THIS SCHEME OVER THE SIMPLE ONE. It is important to understand that refresh tokens are more powerful than access tokens, and so they should be stored, transmitted, and destroyed with care. The refresh token should be destroyed/invalidated on log out (e.g., when a session cookie is invalidated).

The `refresh_token` is delivered alongside the `access_token` in the HTTP response, so the response looks like:

```js
{
  /* ... */
  "access_token": JwtString,
  "refresh_token": JwtString
}
```

The refresh token is also a JSON Web Token. Its expiry is two weeks and the important claim within is the `user_id`. The exact claims in the refresh token look like:

```js
{
  "iat": current_time,
  "exp": current_time + TWO_WEEKS,
  "iss": PUSHER_PLATFORM_ISSUER_KEY,  // FIXME what should this be if a different refresh secret is provided?
  "app": PUSHER_PLATFORM_APP_ID,
  "sub": user_id,
  "refresh": true   // This distinguishes refresh tokens from access tokens
}
```

The refresh key is signed with a private key. For ease-of-use, the private key defaults to `PUSHER_PLATFORM_SECRET_KEY`, but will use a different secret if you provide it in the environment variable `PUSHER_PLATFORM_REFRESH_SECRET_KEY`.

Clients can refresh their token by sending a `POST` request to `/pusherplatform/authorize`. The body must contain form data, with the field `grant_type` set to `refresh_token`. (A non-refresh request can set the `grant_type` to `client_credentials`, although this is not required.) The form field `refresh_token` must be set to the `refresh_token` received in an earlier response.
