/**
 * USSD routes for Africa's Talking callback.
 *
 * Africa's Talking POSTs to this endpoint with:
 *   sessionId, phoneNumber, serviceCode, text
 *
 * We respond with plain text: CON ... or END ...
 */
const express = require('express');
const router = express.Router();
const { handleUssd } = require('../ussd/handler');

// Africa's Talking sends application/x-www-form-urlencoded
router.post('/', express.urlencoded({ extended: false }), async (req, res) => {
  const { sessionId, phoneNumber, serviceCode, text } = req.body;

  const response = await handleUssd({
    sessionId: sessionId || '',
    phoneNumber: phoneNumber || '',
    serviceCode: serviceCode || '',
    text: text || ''
  });

  // AT expects plain text content type
  res.set('Content-Type', 'text/plain');
  res.send(response);
});

module.exports = router;
