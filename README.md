# Hilltech Media Group — Premium Website

A premium, responsive Hilltech Media Group website with:

- Cinematic animated landing page
- Portfolio/gallery
- Service showcase
- WhatsApp CTA
- Project booking system
- Contact/enquiry system
- Secure admin login with bcrypt password hashing
- Server-side sessions stored in SQLite
- Admin dashboard for enquiries and bookings
- Portfolio CRUD in the dashboard
- Booking status management
- CSRF protection
- Helmet security headers and strict CSP
- Rate limiting
- Zod server-side validation
- Parameterized SQLite queries
- No passwords or secrets committed to source control

## Local setup

1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Generate strong random values for `CSRF_SECRET` and `SETUP_SECRET`.
4. Set your WhatsApp number.
5. Install dependencies:

```bash
npm install
```

6. Create your first admin account:

```bash
npm run create-admin
```

The script securely hashes the password with bcrypt before storing it.

7. Start the site:

```bash
npm start
```

Open `http://127.0.0.1:3000`.

Admin login:

`http://127.0.0.1:3000/admin`

## Production

Use HTTPS behind a reverse proxy, set `NODE_ENV=production`, keep the database directory protected, update dependencies regularly, use backups, and put the application behind a proper firewall/reverse proxy. For a real multi-user organization, connect admin authentication to a managed identity provider/SSO.

## Important

The supplied logo is included at:

`public/assets/hilltech-logo.png`

Replace the placeholder business email in `.env` with the real Hilltech email before publishing.
