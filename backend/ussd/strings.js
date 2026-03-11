/**
 * SiSwati + English language strings for USSD menus.
 * Each key maps to { en, ss } where ss = SiSwati.
 */
module.exports = {
  welcome: {
    en: 'Welcome to ConnectLocal\n1. Register\n2. Find Help\n3. Post Request\n4. My Services\n5. Check Status',
    ss: 'Siyakwemukela ku-ConnectLocal\n1. Bhalisa\n2. Tfola Lusito\n3. Faka Sicelo\n4. Tisevisi Tami\n5. Hlola Simo'
  },
  registerName: {
    en: 'Enter your full name:',
    ss: 'Faka ligama lakho:'
  },
  registerWard: {
    en: 'Enter your ward/area:',
    ss: 'Faka indawo yakho:'
  },
  registerRole: {
    en: 'What is your role?\n1. Helper\n2. Requester\n3. Both',
    ss: 'Uyini?\n1. Umsiti\n2. Umceli\n3. Kokubili'
  },
  registerSuccess: {
    en: 'Registration successful! You can now use ConnectLocal.',
    ss: 'Kubhalisa kuphumelele! Manje ungasebentisa ConnectLocal.'
  },
  registerExists: {
    en: 'This phone number is already registered. Dial again to use services.',
    ss: 'Lenombolo seyibhalisiwe. Shayela futsi usebentise tisevisi.'
  },
  findHelpCategory: {
    en: 'Choose a category:\n1. Gardening\n2. Tutoring\n3. Elderly Care\n4. Childcare\n5. Transport\n6. Repairs\n7. Other',
    ss: 'Khetsa umkhakha:\n1. Kulima\n2. Kufundzisa\n3. Kunakekela Labadzala\n4. Kunakekela Bantfwana\n5. Kutfutsa\n6. Kulungisa\n7. Lokunye'
  },
  noServicesFound: {
    en: 'No services found in this category. Try another category.',
    ss: 'Atikho tisevisi kulokhakha. Zama lomunye.'
  },
  serviceItem: {
    en: (title, location, amount) => `${title}\nArea: ${location}\nAmount: R${amount}`,
    ss: (title, location, amount) => `${title}\nIndawo: ${location}\nImali: R${amount}`
  },
  postTitle: {
    en: 'Enter a title for your help request:',
    ss: 'Faka sihloko sesicelo sakho:'
  },
  postCategory: {
    en: 'Choose a category:\n1. Gardening\n2. Tutoring\n3. Elderly Care\n4. Childcare\n5. Transport\n6. Repairs\n7. Other',
    ss: 'Khetsa umkhakha:\n1. Kulima\n2. Kufundzisa\n3. Kunakekela Labadzala\n4. Kunakekela Bantfwana\n5. Kutfutsa\n6. Kulungisa\n7. Lokunye'
  },
  postDescription: {
    en: 'Describe what help you need:',
    ss: 'Chaza lusito loludingako:'
  },
  postSuccess: {
    en: 'Your request has been posted! Helpers will contact you soon.',
    ss: 'Sicelo sakho sifakiwe! Basiti batakukutsintsana nawe masinyane.'
  },
  myServicesNone: {
    en: 'You have no active services.',
    ss: 'Awunato tisevisi letisebentako.'
  },
  statusCheck: {
    en: (title, status) => `${title}\nStatus: ${status}`,
    ss: (title, status) => `${title}\nSimo: ${status}`
  },
  error: {
    en: 'Something went wrong. Please try again later.',
    ss: 'Kukhona lokungahambanga kahle. Zama futsi.'
  },
  invalidInput: {
    en: 'Invalid selection. Please try again.',
    ss: 'Ukukhetsa lokungafanele. Zama futsi.'
  },
  goodbye: {
    en: 'Thank you for using ConnectLocal!',
    ss: 'Siyabonga ngekusebentisa ConnectLocal!'
  },
  langSelect: {
    en: '1. English\n2. SiSwati',
    ss: '1. English\n2. SiSwati'
  }
};
