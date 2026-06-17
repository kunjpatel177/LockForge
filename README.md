# LockForge — Secure Password Manager Web Application

LockForge is a **security-first full-stack password manager** built to securely store and manage user credentials with **end-to-end encryption**, **adaptive authentication**, **multi-device session management**, and **activity monitoring**.

The project focuses on implementing **real-world security concepts** such as encryption, session management, OTP-based authentication, audit logging, and CI/CD deployment automation.

---

## Features

### 1. Secure Credential Storage
- Store credentials for multiple services (Gmail, GitHub, LinkedIn, etc.)
- Support for **dynamic custom fields**:
  - Text
  - Password
  - OTP

### 2. AES-256 Encryption
Sensitive credential fields are encrypted before being stored in the database.

Implemented using:

- AES-256-CBC encryption
- Random IV (Initialization Vector)
- Encrypted data stored in secure format

### 3. PBKDF2-Based Key Derivation

Encryption key is generated from the user's master password using **PBKDF2**.

Benefits:

- Prevents brute-force attacks
- Uses random salt
- Encryption key is **never stored in database**

Flow:

```text
User Password
      ↓
PBKDF2 + Salt
      ↓
Generate Encryption Key
      ↓
AES Encrypt Credentials
```

### 4. Adaptive Authentication (OTP Verification)

The system detects suspicious logins based on:

- Device change
- Location change

If suspicious activity is detected:

- OTP is generated
- OTP is sent to registered email
- User must verify OTP before login

Features:

- 6-digit OTP
- Auto-submit when all digits entered
- Countdown timer
- OTP resend functionality
- Masked email display

### 5. Multi-Device Session Management

Users can monitor active sessions across devices.

Features:

- View all active devices
- Track:
  - Device type
  - Browser
  - Operating system
  - IP address
  - Location
- Logout specific device remotely
- Logout all other devices instantly

### 6. Activity Audit Logging

Every important action is logged.

Tracked activities:

- Login
- OTP verification
- Logout
- Credential creation
- Credential update
- Credential deletion
- Export credentials

Stored details:

- IP address
- Device information
- Timestamp
- Location

### 7. Security Protections

Implemented multiple security layers:

- CSRF Protection
- Rate Limiting
- Secure Session Cookies
- Input Validation
- Password Strength Validation
- Suspicious Login Detection

### 8. Secure PDF Export

Users can export all stored credentials into PDF format.

Security flow:

```text
User clicks Export
      ↓
Re-enter Master Password
      ↓
Password Verification
      ↓
Decrypt Credentials
      ↓
Generate PDF
```

Sensitive data is decrypted only after password verification.

### 9. Location Tracking

Login location detection using IP-based geolocation.

Used for:

- Suspicious login detection
- Activity history tracking
- Session monitoring

### 10. CI/CD Pipeline (GitHub Actions)

Implemented automated deployment pipeline using **GitHub Actions** and **Render**.

Workflow:

```text
Push Code to GitHub
        ↓
GitHub Actions Runs
        ↓
Install Dependencies
        ↓
Run Tests
        ↓
Trigger Render Deployment
        ↓
Website Auto Updates
```

Benefits:

- Automated deployment
- Faster development workflow
- Reliable release pipeline

---

## Project Architecture

```text
Client (EJS + JavaScript)
            ↓
Express Server (Routes)
            ↓
Controllers (Business Logic)
            ↓
Middleware (Auth + Security)
            ↓
MongoDB Database
```

Architecture pattern:

- MVC Architecture
- Server-side rendering with EJS

---

## Tech Stack

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Frontend
- EJS
- JavaScript
- Bootstrap 5
- HTML5
- CSS3

### Security
- bcrypt
- crypto (AES-256 + PBKDF2)
- express-session
- csurf
- express-rate-limit
- helmet

### Other Libraries
- Nodemailer
- connect-mongo
- IP Geolocation API
- UA Parser JS

### DevOps
- GitHub Actions
- Render Deployment

---

## Authentication Flow

```text
User Login
     ↓
Validate Email + Password
     ↓
bcrypt Password Check
     ↓
Generate Encryption Key (PBKDF2)
     ↓
Check Device + Location
     ↓
If Suspicious → OTP Verification
     ↓
Create Session
     ↓
Store Audit Log
     ↓
Redirect to Dashboard
```

---

## Local Setup

Clone repository

```bash
git clone https://github.com/kunjpatel177/LockForge.git
```

Install dependencies

```bash
npm install
```

Create `.env`

```env
MONGO_URI=your_mongodb_url
SESSION_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

Run locally

```bash
node server.js
```

---

## Author

**Kunj Patel**

GitHub: https://github.com/kunjpatel177/