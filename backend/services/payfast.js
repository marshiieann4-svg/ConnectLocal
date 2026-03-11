const crypto = require('crypto');

/**
 * PayFast integration service for ConnectLocal.
 *
 * In sandbox mode the merchant_id / merchant_key come from env
 * and every URL points at sandbox.payfast.co.za.
 *
 * Docs: https://developers.payfast.co.za/docs
 */

const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX !== 'false'; // default true
const BASE_URL = PAYFAST_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

const VALIDATE_URL = PAYFAST_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/query/validate'
  : 'https://www.payfast.co.za/eng/query/validate';

/**
 * Build the data object PayFast expects, generate a signature,
 * and return the full redirect URL a browser should be sent to.
 */
function generatePaymentUrl({ paymentId, amount, itemName, buyerEmail, buyerName }) {
  const data = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY,
    return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/${paymentId}/success`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/${paymentId}/cancel`,
    notify_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`,
    m_payment_id: paymentId,
    amount: Number(amount).toFixed(2),
    item_name: itemName.substring(0, 100),
  };

  if (buyerEmail) data.email_address = buyerEmail;
  if (buyerName) data.name_first = buyerName.split(' ')[0];

  // Build signature string (alphabetical keys, URL-encoded values, no passphrase in sandbox)
  const passphrase = process.env.PAYFAST_PASSPHRASE || '';
  const signatureString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');

  const withPassphrase = passphrase
    ? `${signatureString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
    : signatureString;

  const signature = crypto.createHash('md5').update(withPassphrase).digest('hex');
  data.signature = signature;

  // Build full URL with query string
  const qs = Object.entries(data)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  return `${BASE_URL}?${qs}`;
}

/**
 * Validate an incoming IPN (Instant Payment Notification) from PayFast.
 * Returns true if the signature matches.
 */
function validateIPN(body) {
  const passphrase = process.env.PAYFAST_PASSPHRASE || '';

  // Reconstruct signature from the POST body (exclude 'signature')
  const params = { ...body };
  delete params.signature;

  const signatureString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`)
    .join('&');

  const withPassphrase = passphrase
    ? `${signatureString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
    : signatureString;

  const computed = crypto.createHash('md5').update(withPassphrase).digest('hex');
  return computed === body.signature;
}

module.exports = { generatePaymentUrl, validateIPN, BASE_URL, VALIDATE_URL };
