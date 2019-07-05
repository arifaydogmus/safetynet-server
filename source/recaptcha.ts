import fetch from 'node-fetch';

/**
 * Google Play SafetyNet Android Recaptcha Verification
 */

// Default behaviour pass on failure
const PASS_ON_FAILURE = Boolean(process.env.SAFETYNET_PASS_ON_FAILURE || true);

export interface VerifyRecaptchaResult {
  success: boolean;
  time: string;
  app: string;
  error: string | null;
}

type VerifyRecaptcha = (
  token: string,
  apiSecret: string
) => Promise<VerifyRecaptchaResult>;

// SafetyNet Recaptcha
// Verify recaptcha token via Google API
export const verifyRecaptchaWithAPI: VerifyRecaptcha = async (
  token,
  apiSecret
) => {
  const result: VerifyRecaptchaResult = {
    success: PASS_ON_FAILURE,
    time: '',
    app: '',
    error: null,
  };
  if (!apiSecret || !token) {
    result.error = 'API Secret or Token is missing.';
    return result;
  }
  const API_URL = 'https://www.google.com/recaptcha/api/siteverify';

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${apiSecret}&response=${token}`,
    }).then(async response => {
      if (response.status === 200) {
        const json = await response.json();
        result.success = json.success;
        result.app = json.apk_package_name || '';
        result.time = json.challenge_ts || '';
        if (json['error-codes']) {
          result.error = json['error-codes'][0];
        }
        return;
      }

      result.error = await response.statusText;
      return;
    });

    return result;
  } catch (err) {
    result.error = err;
    return result;
  }
};
