# Change Log

This project adheres to [Semantic Versioning Scheme](http://semver.org)

## [v0.7.0] 2017-07-17

### Fixes

- Fixed the issue with path - requests now work again.

### Changes

- Removed `generateSuperUserJWT` in `Instance`.
- Allow `Authenticator` to take in custom `tokenExpiry` and `tokenLeeway` - for SuperUser requests
- Rename exported `TOKEN_EXPIRY` to `DEFAULT_TOKEN_EXPIRY`

## [v0.6.1] 2017-07-11

### Changes

- Service claims are now optional

## [v0.6.0] 2017-07-10

### Changes

- Changed the artifact name to `pusher-platform-node`
- Renamed `App` to `Instance`, `appId` to `instanceId`.
- Updated the tenancy to the upcoming standard: https://cluster.and.host/services/serviceName/serviceVersion/instanceId/...


_.. prehistory_