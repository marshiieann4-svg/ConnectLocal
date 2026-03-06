const cron = require('node-cron');
const SafetyLog = require('../models/Safetylog');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
// const sendEmail = require('../utils/email'); // we'll create later

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Checking for missed check-outs...');
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const missedLogs = await SafetyLog.find({
    status: 'checked_in',
    checkInTime: { $lt: fourHoursAgo },
    alertSent: false
  }).populate('assignmentId').populate('helperId').populate('clientId');

  for (const log of missedLogs) {
    // Send email to organization
    const organization = await User.findById(log.assignmentId.organizationId);
    if (organization && organization.email) {
      // await sendEmail(organization.email, 'Missed Check-Out Alert', `Helper ${log.helperId.name} did not check out from client ${log.clientId.name} after 4 hours.`);
      console.log(`Alert sent to ${organization.email}`);
    }
    log.alertSent = true;
    log.status = 'missed';
    await log.save();
  }
});