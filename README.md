# Google SafetyNet Attestation Verification on Server Side

## About SafetyNet

SafetyNet is a tamper-detection framework that is part of recent versions of Google Play Services. All Play-enabled Android devices using Android 2.3 and above already use SafetyNet as long as the Play Services package is updated. Among other things, this service informs Google about the ‘safety’ status of each device, providing indicators related to rooting, tampering, active man-in-the-attacks and others.

Google provides an API to verify device integrity and detect harmful apps. See the [SafetyNet documentation](https://developer.android.com/training/safetynet/index.html) for more information.

## About Package

You want to ensure that the device your application is running on is not rooted or tampered with in some other way. The application may choose to do client-side checks which is insecure.

You can combine `react-native-safetynet-client` and this package for server side verification. See the [Using Safetynet API](https://www.synopsys.com/blogs/software-security/using-safetynet-api/) article for more details.

## Getting Started

`$ npm install safetynet-server`

or

`$ yarn add safetynet-server`

## Usage

```javascript
import * as SafetyNet from 'safetynet-server';

// STEP 1: Catch the client request for creating nonce from server side
const nonce = SafetyNet.createNonce([
  'some',
  'additional data',
  'from client',
  'like unique device id',
]);

// Send nonce to the client
// Client will send attestation request to Google Play
// and will send back the attestation result JWS to server

// STEP 2: Get the JWS from client and verify it with Google API
const apiKey = 'Your Google Android DeviceVerification Api Key';
const generatedNonce = 'Nonce previously created and stored by the server';
const signedAttestation = 'JWS coming from client';
const isDeviceVerified = await verifyDeviceWithAPI(
  generatedNonce,
  signedAttestation,
  apiKey
);

// You'll allow or denied to that device to use your server according to the result.
// Such as allow to login only for verified device, allow to use your api only for verified device etc...
```

## Default Behaviour on Failure

By default, we assume the device is verified if an error will occure.

You can change the default behaviour via ENV variable which is `PASS_ON_FAILURE`
