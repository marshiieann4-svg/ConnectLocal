const cron = require('node-cron');
const SafetyLog = require('../models/Safetylog');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const sendEmail = require('../utils/emails');

const startMissedCheckoutMonitor = () => {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('🔍 Checking for missed check-outs...');
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      
      const missedLogs = await SafetyLog.find({
        status: 'checked_in',
        checkInTime: { $lt: fourHoursAgo },
        alertSent: false
      })
        .populate('assignmentId')
        .populate('helperId', 'name phone')
        .populate('clientId', 'name phone address');

      for (const log of missedLogs) {
        try {
          // Send email to organization
          const organization = await User.findById(log.assignmentId.organizationId);
          if (organization && organization.email) {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #dc3545;">⚠️ Missed Check-Out Alert</h2>
                <p>A helper has not checked out after 4 hours.</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Helper:</strong> ${log.helperId.name} (${log.helperId.phone})</p>
                  <p><strong>Client:</strong> ${log.clientId.name} (${log.clientId.phone})</p>
                  <p><strong>Address:</strong> ${log.clientId.address || 'Not provided'}</p>
                  <p><strong>Check-in Time:</strong> ${new Date(log.checkInTime).toLocaleString()}</p>
                </div>
                <p style="color: #dc3545;"><strong>Action Required:</strong> Please contact the helper immediately to verify their safety.</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated safety alert from ConnectLocal.</p>
              </div>
            `;
            await sendEmail(organization.email, '⚠️ ConnectLocal: Missed Check-Out Alert', emailHtml);
            console.log(`✅ Alert sent to ${organization.email} for helper ${log.helperId.name}`);
          }
          
          log.alertSent = true;
          log.status = 'missed';
          await log.save();
        } catch (emailError) {
          console.error(`❌ Failed to send alert for log ${log._id}:`, emailError.message);
        }
      }
      
      if (missedLogs.length > 0) {
        console.log(`✅ Processed ${missedLogs.length} missed check-out(s)`);
      }
    } catch (error) {
      console.error('❌ Error in missed checkout monitor:', error);
    }
  });
  
  console.log('✅ Missed checkout monitor started (runs every 30 minutes)');
};

module.exports = { startMissedCheckoutMonitor };