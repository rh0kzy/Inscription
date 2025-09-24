const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email credentials not configured. Email notifications will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service error:', error.message);
      } else {
        console.log('📧 Email service ready');
      }
    });
  }

  async sendInscriptionConfirmation(inscription) {
    if (!this.transporter) {
      console.log('📧 Email not configured - would send confirmation to:', inscription.email);
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: inscription.email,
      subject: 'Inscription Received - Confirmation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .email-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .status-pending { color: #ff9800; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🎓 Inscription Received</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${inscription.first_name} ${inscription.last_name}</strong>,</p>
              
              <p>Thank you for your inscription! We have successfully received your application.</p>
              
              <div class="info-box">
                <h3>📋 Application Details</h3>
                <p><strong>Program:</strong> ${inscription.program}</p>
                <p><strong>Email:</strong> ${inscription.email}</p>
                <p><strong>Status:</strong> <span class="status-pending">Pending Review</span></p>
                <p><strong>Submitted:</strong> ${new Date(inscription.created_at).toLocaleDateString()}</p>
              </div>
              
              <p>Your application is currently under review by our admissions team. You will receive an email notification once a decision has been made.</p>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>The Admissions Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('📧 Confirmation email sent to:', inscription.email);
    } catch (error) {
      console.error('❌ Failed to send confirmation email:', error.message);
    }
  }

  async sendDecisionNotification(inscription, decision, adminNotes = '') {
    if (!this.transporter) {
      console.log(`📧 Email not configured - would send ${decision} notification to:`, inscription.email);
      return;
    }

    const isApproved = decision === 'approved';
    const subject = isApproved ? 'Congratulations! Your inscription has been approved' : 'Update on your inscription application';
    const statusColor = isApproved ? '#4caf50' : '#f44336';
    const statusText = isApproved ? 'Approved ✅' : 'Rejected ❌';
    const headerText = isApproved ? '🎉 Congratulations!' : '📋 Application Update';

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: inscription.email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .email-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .status-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid ${statusColor}; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .status { color: ${statusColor}; font-weight: bold; font-size: 18px; }
            .notes { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>${headerText}</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${inscription.first_name} ${inscription.last_name}</strong>,</p>
              
              ${isApproved ? 
                '<p>We are pleased to inform you that your inscription has been <strong>approved</strong>! Welcome to our program.</p>' :
                '<p>Thank you for your interest in our program. After careful review, we regret to inform you that your application has not been approved at this time.</p>'
              }
              
              <div class="status-box">
                <h3>📋 Application Status</h3>
                <p><strong>Program:</strong> ${inscription.program}</p>
                <p><strong>Status:</strong> <span class="status">${statusText}</span></p>
                <p><strong>Decision Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              ${adminNotes ? `
                <div class="info-box">
                  <h3>📝 Additional Notes</h3>
                  <div class="notes">${adminNotes}</div>
                </div>
              ` : ''}
              
              ${isApproved ? 
                '<p>You will receive further instructions regarding the next steps in your enrollment process within the next few days.</p>' :
                '<p>We encourage you to apply again in the future. If you have any questions about this decision, please feel free to contact us.</p>'
              }
              
              <p>Thank you for your interest in our program.</p>
              
              <p>Best regards,<br>The Admissions Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 ${decision} notification sent to:`, inscription.email);
    } catch (error) {
      console.error(`❌ Failed to send ${decision} notification:`, error.message);
    }
  }
}

module.exports = new EmailService();