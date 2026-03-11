/**
 * SMS notification service using Africa's Talking.
 *
 * Requires env vars:
 *   AT_API_KEY     — Africa's Talking API key
 *   AT_USERNAME    — Africa's Talking username (sandbox = 'sandbox')
 *   AT_SENDER_ID   — Optional sender ID (e.g. 'ConnLocal')
 */

let smsClient = null;

function getSmsClient() {
  if (smsClient) return smsClient;

  // Lazy-require so the server doesn't crash if africastalking isn't installed yet
  try {
    const AfricasTalking = require('africastalking');
    const at = AfricasTalking({
      apiKey: process.env.AT_API_KEY,
      username: process.env.AT_USERNAME || 'sandbox'
    });
    smsClient = at.SMS;
    return smsClient;
  } catch {
    console.warn('africastalking SDK not installed — SMS disabled. Run: npm install africastalking');
    return null;
  }
}

/**
 * Send an SMS notification.
 * @param {string} to   — Phone number in international format (+268...)
 * @param {string} message — SMS body (max 160 chars for single SMS)
 */
async function sendSms(to, message) {
  const client = getSmsClient();
  if (!client) {
    console.log(`[SMS stub] To: ${to} | ${message}`);
    return { stub: true };
  }

  try {
    const result = await client.send({
      to: [to],
      message,
      from: process.env.AT_SENDER_ID || undefined
    });
    console.log('SMS sent:', result);
    return result;
  } catch (err) {
    console.error('SMS send error:', err);
    throw err;
  }
}

/**
 * Notify a helper that they've been assigned to a service.
 */
async function notifyHelperAssigned(phone, serviceTitle) {
  const msg = `ConnectLocal: You've been assigned to "${serviceTitle}". Open the app or dial *134*555# for details.`;
  return sendSms(phone, msg);
}

/**
 * Notify a requester that a helper applied to their service.
 */
async function notifyNewOffer(phone, serviceTitle, helperName) {
  const msg = `ConnectLocal: ${helperName} has offered to help with "${serviceTitle}". Check the app to accept.`;
  return sendSms(phone, msg);
}

/**
 * Notify a user that a service status changed.
 */
async function notifyStatusChange(phone, serviceTitle, newStatus) {
  const msg = `ConnectLocal: "${serviceTitle}" is now ${newStatus}.`;
  return sendSms(phone, msg);
}

/**
 * Notify a helper that payment has been released.
 */
async function notifyPaymentReleased(phone, amount, serviceTitle) {
  const msg = `ConnectLocal: R${amount.toFixed(2)} has been released for "${serviceTitle}". Thank you!`;
  return sendSms(phone, msg);
}

module.exports = {
  sendSms,
  notifyHelperAssigned,
  notifyNewOffer,
  notifyStatusChange,
  notifyPaymentReleased
};
