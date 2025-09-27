const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfiguration() {
  console.log('🧪 Testing email configuration...');
  console.log('📧 Email User:', process.env.EMAIL_USER);
  console.log('📧 Email Service:', process.env.EMAIL_SERVICE);
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify connection
    console.log('🔄 Verifying email connection...');
    await transporter.verify();
    console.log('✅ Email connection verified successfully!');

    // Send test email
    const testMailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: '✅ Test Email - Inscription Decision System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎓 Email Configuration Test</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>This is a test email from your inscription decision system.</p>
            <p><strong>✅ Email service is working correctly!</strong></p>
            <p>You can now send approval and rejection notifications to applicants.</p>
            <hr>
            <p><small>Test sent on: ${new Date().toLocaleString()}</small></p>
          </div>
        </div>
      `
    };

    console.log('📤 Sending test email...');
    const info = await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📄 Message ID:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure 2-Factor Authentication is enabled on your Gmail account');
      console.log('2. Generate an App Password instead of using your regular password');
      console.log('3. Visit: https://myaccount.google.com/apppasswords');
    } else if (error.message.includes('Username and Password not accepted')) {
      console.log('\n💡 Gmail Security Tips:');
      console.log('1. Enable "Less secure app access" (not recommended) OR');
      console.log('2. Use App Password with 2FA enabled (recommended)');
    }
    
    return false;
  }
}

// Run the test
testEmailConfiguration()
  .then(success => {
    if (success) {
      console.log('\n🎉 Email system is ready for sending inscription decisions!');
    } else {
      console.log('\n⚠️  Please fix the email configuration before using the system.');
    }
  })
  .catch(error => {
    console.error('Test failed:', error);
  });