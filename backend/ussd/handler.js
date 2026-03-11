/**
 * USSD Session State Machine for ConnectLocal.
 *
 * Africa's Talking sends a POST with:
 *   - sessionId, phoneNumber, serviceCode, text
 *
 * `text` is a concatenated string of all user inputs separated by `*`.
 * We parse the depth of inputs to determine where the user is in the flow.
 *
 * Response format:
 *   CON ... (continue — expects more input)
 *   END ... (terminate session)
 */

const User = require('../models/User');
const Service = require('../models/Service');
const strings = require('./strings');

const CATEGORIES = ['gardening', 'tutoring', 'elderly_care', 'childcare', 'transport', 'repairs', 'other'];

function t(key, lang) {
  const entry = strings[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

/**
 * Main USSD handler. Receives AT payload, returns CON/END response string.
 */
async function handleUssd({ sessionId, phoneNumber, serviceCode, text }) {
  // Normalise phone to local format used in DB (e.g. 0681234567)
  const phone = normalisePhone(phoneNumber);
  const inputs = text === '' ? [] : text.split('*');

  try {
    // Step 0: language selection
    if (inputs.length === 0) {
      return con('Welcome to ConnectLocal / Siyakwemukela\n' + t('langSelect', 'en'));
    }

    const lang = inputs[0] === '2' ? 'ss' : 'en';

    // Step 1: main menu
    if (inputs.length === 1) {
      return con(t('welcome', lang));
    }

    const choice = inputs[1];

    // ----- 1. REGISTER -----
    if (choice === '1') {
      return await handleRegister(inputs, phone, lang);
    }

    // ----- 2. FIND HELP -----
    if (choice === '2') {
      return await handleFindHelp(inputs, lang);
    }

    // ----- 3. POST REQUEST -----
    if (choice === '3') {
      return await handlePostRequest(inputs, phone, lang);
    }

    // ----- 4. MY SERVICES -----
    if (choice === '4') {
      return await handleMyServices(phone, lang);
    }

    // ----- 5. CHECK STATUS -----
    if (choice === '5') {
      return await handleCheckStatus(phone, lang);
    }

    return end(t('invalidInput', lang));
  } catch (err) {
    console.error('USSD error:', err);
    return end(t('error', 'en'));
  }
}

// ========== REGISTER FLOW ==========
async function handleRegister(inputs, phone, lang) {
  // Check if already registered
  const existing = await User.findOne({ phone });
  if (existing && inputs.length === 2) {
    return end(t('registerExists', lang));
  }

  // Step: ask name
  if (inputs.length === 2) return con(t('registerName', lang));
  // Step: ask ward
  if (inputs.length === 3) return con(t('registerWard', lang));
  // Step: ask role
  if (inputs.length === 4) return con(t('registerRole', lang));

  // Step: create user
  if (inputs.length === 5) {
    const name = inputs[2];
    const ward = inputs[3];
    const roleMap = { '1': 'helper', '2': 'requester', '3': 'both' };
    const role = roleMap[inputs[4]] || 'both';

    await User.create({
      phone,
      name,
      ward,
      accountType: 'individual',
      role,
      verificationLevel: 0,
      averageRating: 0,
      totalRatings: 0,
      communityPoints: 0
    });

    return end(t('registerSuccess', lang));
  }

  return end(t('error', lang));
}

// ========== FIND HELP FLOW ==========
async function handleFindHelp(inputs, lang) {
  // Step: ask category
  if (inputs.length === 2) return con(t('findHelpCategory', lang));

  // Step: show results
  if (inputs.length === 3) {
    const catIdx = parseInt(inputs[2]) - 1;
    const category = CATEGORIES[catIdx] || 'other';

    const services = await Service.find({ category, status: 'open' })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    if (services.length === 0) {
      return end(t('noServicesFound', lang));
    }

    const list = services.map((s, i) => {
      const fn = strings.serviceItem[lang] || strings.serviceItem.en;
      return `${i + 1}. ${fn(s.title, s.location, s.paymentAmount || 0)}`;
    }).join('\n\n');

    return end(list);
  }

  return end(t('invalidInput', lang));
}

// ========== POST REQUEST FLOW ==========
async function handlePostRequest(inputs, phone, lang) {
  const user = await User.findOne({ phone });
  if (!user) return end(t('registerExists', lang).replace('already', 'first'));

  // Step: ask title
  if (inputs.length === 2) return con(t('postTitle', lang));
  // Step: ask category
  if (inputs.length === 3) return con(t('postCategory', lang));
  // Step: ask description
  if (inputs.length === 4) return con(t('postDescription', lang));

  // Step: create service
  if (inputs.length === 5) {
    const title = inputs[2];
    const catIdx = parseInt(inputs[3]) - 1;
    const category = CATEGORIES[catIdx] || 'other';
    const description = inputs[4];

    await Service.create({
      title,
      description,
      category,
      requesterId: user._id,
      location: user.ward,
      urgency: 'anytime',
      status: 'open'
    });

    return end(t('postSuccess', lang));
  }

  return end(t('error', lang));
}

// ========== MY SERVICES ==========
async function handleMyServices(phone, lang) {
  const user = await User.findOne({ phone });
  if (!user) return end(t('registerExists', lang));

  const services = await Service.find({
    $or: [{ requesterId: user._id }, { helperId: user._id }]
  }).sort({ createdAt: -1 }).limit(3).lean();

  if (services.length === 0) return end(t('myServicesNone', lang));

  const list = services.map((s, i) => {
    const fn = strings.statusCheck[lang] || strings.statusCheck.en;
    return `${i + 1}. ${fn(s.title, s.status)}`;
  }).join('\n\n');

  return end(list);
}

// ========== CHECK STATUS ==========
async function handleCheckStatus(phone, lang) {
  // Same as My Services for now — shows latest service status
  return handleMyServices(phone, lang);
}

// ========== HELPERS ==========
function con(message) { return `CON ${message}`; }
function end(message) { return `END ${message}`; }

function normalisePhone(phone) {
  // AT sends +268XXXXXXXX or +27XXXXXXXXX — convert to 0XXXXXXXXX
  let p = phone.replace(/\s+/g, '');
  if (p.startsWith('+268')) p = '0' + p.slice(4);    // Eswatini
  else if (p.startsWith('+27')) p = '0' + p.slice(3); // South Africa
  else if (p.startsWith('+')) p = '0' + p.slice(1);
  return p;
}

module.exports = { handleUssd };
