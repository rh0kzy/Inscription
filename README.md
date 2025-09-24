# Modern Inscription System

A complete, modern inscription (registration) system with admin approval workflow and email notifications.

## 🌟 Features

### User Features
- **Modern Registration Form**: Clean, responsive design with real-time validation
- **Multiple Programs**: Support for various academic programs
- **Email Confirmation**: Automatic confirmation emails upon submission
- **Status Tracking**: Users receive email notifications about approval decisions

### Admin Features
- **Secure Dashboard**: JWT-based authentication for admin access
- **Application Management**: View, filter, and search through applications
- **Approval Workflow**: Approve or reject applications with optional notes
- **Statistics Dashboard**: Real-time statistics and analytics
- **Email Notifications**: Automatic emails sent to applicants based on decisions
- **Responsive Design**: Works perfectly on desktop and mobile devices

### Technical Features
- **Modern UI/UX**: Beautiful gradient designs and smooth animations
- **Security**: Rate limiting, input validation, XSS protection
- **Database**: SQLite with proper schema and relationships
- **Email Service**: Configurable email service (Gmail, SMTP)
- **RESTful API**: Clean API endpoints for all operations
- **Error Handling**: Comprehensive error handling and user feedback

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   cd c:\Users\PC\Desktop\Studies\Inscription
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   copy .env.example .env
   ```
   
   Edit the `.env` file with your settings:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # JWT Secret (Change this!)
   JWT_SECRET=your-super-secret-jwt-key-change-in-production

   # Email Configuration (Gmail example)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com

   # Admin Configuration
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=admin123
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Registration Form: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin
   - Admin Login: http://localhost:3000/admin/login

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password
3. Use your email and the app password in `.env`:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

### Other Email Providers
You can configure other SMTP providers by updating the email service configuration in `config/email.js`.

## 🔐 Admin Access

### Default Credentials
- **Email**: admin@example.com
- **Password**: admin123

**⚠️ Important**: Change these credentials immediately after first login!

### Admin Features
- **Dashboard**: Statistics overview with real-time data
- **Application Management**: View, filter, and search applications
- **Decision Making**: Approve or reject applications with optional notes
- **Email Notifications**: Automatic emails sent to applicants
- **Responsive Design**: Works on all devices

## 📁 Project Structure

```
inscription-system/
├── config/
│   ├── database.js      # Database configuration and initialization
│   └── email.js         # Email service configuration
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── admin.js        # Admin API routes
│   └── inscriptions.js # Public inscription routes
├── public/
│   ├── index.html      # Registration form
│   ├── admin-login.html # Admin login page
│   └── admin.html      # Admin dashboard
├── scripts/
│   └── init-db.js      # Database initialization script
├── database/
│   └── inscriptions.db # SQLite database (created automatically)
├── server.js           # Main server file
├── package.json        # Dependencies and scripts
└── .env               # Environment configuration
```

## 🛠️ API Endpoints

### Public Endpoints
- `POST /api/inscriptions` - Submit new inscription
- `GET /api/inscriptions/:id` - Get inscription by ID

### Auth Endpoints
- `POST /api/auth/login` - Admin login
- `POST /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Admin logout

### Admin Endpoints (Requires Authentication)
- `GET /api/admin/inscriptions` - Get inscriptions with filters
- `GET /api/admin/inscriptions/:id` - Get specific inscription
- `PATCH /api/admin/inscriptions/:id/status` - Update inscription status
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

## 🎨 Customization

### Styling
The application uses modern CSS with:
- CSS Grid and Flexbox for layouts
- CSS Variables for consistent theming
- Smooth animations and transitions
- Responsive breakpoints
- Custom gradients and shadows

### Programs
You can modify the available programs by editing the select options in `public/index.html`:
```html
<option value="Your Program">Your Program</option>
```

### Email Templates
Email templates can be customized in `config/email.js`. The system supports:
- HTML email templates
- Dynamic content insertion
- Responsive email design
- Inline CSS for compatibility

## 🔒 Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Server-side validation for all inputs
- **XSS Protection**: Helmet.js for security headers
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **SQL Injection Prevention**: Parameterized queries

## 📱 Mobile Responsive

The application is fully responsive and works perfectly on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production` in your `.env` file
2. Use a strong `JWT_SECRET`
3. Configure proper email credentials
4. Set up SSL/HTTPS
5. Configure a process manager (PM2, systemd)

### Database
- The SQLite database is perfect for small to medium applications
- For larger deployments, consider migrating to PostgreSQL or MySQL
- Regular backups are recommended

### Security Considerations
- Change default admin credentials immediately
- Use environment variables for all secrets
- Enable HTTPS in production
- Regular security updates
- Monitor and log access attempts

## 🤝 Support

For issues or questions:
1. Check the console output for error messages
2. Verify your `.env` configuration
3. Ensure all dependencies are installed
4. Check that ports are not in use

## 📄 License

This project is open source and available under the MIT License.

---

**🎓 Ready to accept applications!** The system is designed to be professional, secure, and user-friendly for both applicants and administrators.