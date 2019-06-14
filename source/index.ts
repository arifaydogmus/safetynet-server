import fetch from 'node-fetch';
import * as crypto from 'crypto';
import jws from 'jws';

/**
 * Google Play SafetyNet Android Device Verification
 *
 * QUICK NOTES:
 *
 * We assume device is verified during following situations if SAFETYNET_PASS_ON_FAILURE is true;
 * - We reached to verification api rate limit (Status code: 429)
 * - The verification api failed to response (Status code is neither 200 nor 429)
 *
 * Attestation Api Rate Limits:
 * 10.000 query per day
 * 5 query per individual device in a minute
 *
 */

// Default behaviour pass on failure
const PASS_ON_FAILURE = Boolean(process.env.SAFETYNET_PASS_ON_FAILURE || true);

export interface CreateNonceResult {
  nonce: string;
  timeStamp: string;
}

export interface VerifySignatureResult {
  isValidSignature: boolean;
  status?: number;
  error: string | null;
}

type GenerateHash = (value: string) => string;

type CreateNonce = (args?: string | string[]) => Promise<CreateNonceResult>;

type VerifySignature = (
  signedAttestation: string,
  apiKey: string
) => Promise<VerifySignatureResult>;

type VerifyDevice = (
  nonce: string,
  signedAttestation: string
) => Promise<boolean>;

const generateHash: GenerateHash = value =>
  crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');

// Create nonce for attestation request
export const createNonce: CreateNonce = async args => {
  let nonce: string;
  const timeStamp = new Date().getTime().toString();
  const timeStampHash = generateHash(timeStamp);
  const randomString = crypto.randomBytes(32).toString('base64');
  const randomStringHash = generateHash(randomString);

  nonce = `${timeStampHash}${randomStringHash}`;

  if (typeof args === 'string') {
    nonce += generateHash(args);
  }

  if (Array.isArray(args)) {
    nonce += args.map(val => generateHash(val)).join('');
  }
  return { nonce, timeStamp };
};

// Verify nonce request result via Google API
export const verifySignatureWithAPI: VerifySignature = async (
  signedAttestation,
  apiKey
) => {
  const result: VerifySignatureResult = {
    isValidSignature: PASS_ON_FAILURE,
    error: null,
  };
  if (!apiKey) {
    return result;
  }
  const API_URL = `https://www.googleapis.com/androidcheck/v1/attestations/verify?key=${apiKey}`;

  try {
    const verificationResult: VerifySignatureResult = await fetch(API_URL, {
      method: 'POST',
      compress: false,
      body: JSON.stringify({ signedAttestation }),
    }).then(async response => {
      if (response.status === 200) {
        return response.json();
      }

      result.status = response.status;
      result.error = await response.statusText;
      return result;
    });

    verificationResult.error = null;
    return verificationResult;
  } catch (err) {
    result.error = err;
    return result;
  }
};

// Verify Jws with Google Safety API (Online verify) Subject to API rate limits
export const verifyDevice: VerifyDevice = async (nonce, signedAttestation) => {
  if (!nonce || !signedAttestation) {
    return false;
  }

  const decodedJws = jws.decode(signedAttestation);
  const payload = JSON.parse(decodedJws.payload);
  const result = nonce === payload.nonce && payload.basicIntegrity;

  return result;
};
