# ReAppoint - Appointment Booking System

A production-ready appointment booking SaaS platform built with Next.js, featuring intelligent waitlist management, appointment reminders, timezone support, and AI-powered no-show prediction.

## 🎯 Features

### For Clients
- 🗓️ Browse available appointment slots with real-time availability
- 📅 Book appointments with automatic timezone handling
- ⏰ Receive appointment reminders 24 hours before
- ✅ Confirm attendance with one-click verification
- 📋 Waitlist management with automatic slot offers
- 📊 View appointment history and statistics

### For Businesses
- 📈 Complete business dashboard with appointment analytics
- 🎛️ Service management with customizable pricing and duration
- 📬 Manage waitlists and automatic offers
- 📧 Email notifications for confirmations and cancellations
- ⚠️ No-show risk scoring with client risk profiles
- ⏱️ Operating hours configuration

### Core System
- 🌍 **Timezone Support** - All times stored in UTC, displayed in user's local timezone
- 🤖 **AI Risk Scoring** - Predicts no-shows based on booking patterns, client history, time of day
- ⏰ **Hourly Reminders** - AWS Lambda cron job sends reminders 24-25 hours before appointment
- 📧 **SendGrid Integration** - Transactional emails for bookings, reminders, waitlist offers
- 🔐 **Authentication** - NextAuth.js with Google OAuth and email/password login
- 💾 **Database** - PostgreSQL via Supabase with Prisma ORM

## 🏗️ Tech Stack

- **Frontend**: Next.js 16.1 (App Router), React 19.2, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, NextAuth.js 4.24
- **Database**: PostgreSQL (Supabase) + Prisma 6.19 ORM
- **Email**: SendGrid
- **Cron Jobs**: AWS Lambda + EventBridge Scheduler
- **Hosting**: Vercel (frontend), AWS Lambda (cron jobs)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database (Supabase recommended)
- SendGrid account for email sending
- Google OAuth credentials (optional, for OAuth login)
- AWS account (for Lambda cron jobs)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/slayer1371/ReAppoint.git
cd appointment-optimizer
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in your `.env.local`:
```env
# Database (use transaction pooler port 6543)
DATABASE_URL="postgresql://user:password@host:6543/postgres?schema=public&pgbouncer=true"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth (optional)
GITHUB_ID="..."
GITHUB_SECRET="..."
GOOGLE_ID="..."
GOOGLE_SECRET="..."

# Email
SENDGRID_API_KEY="SG.xxxxx"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# Cron jobs
CRON_SECRET="your-cron-secret"
```

4. **Set up database**
```bash
npx prisma migrate deploy
npx prisma db seed  # if seed script exists
```

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

### Key Models

**Appointment**
- Stores appointment bookings with UTC timestamps
- Includes `timezone` field (user's local timezone for email formatting)
- AI risk scoring: `aiRiskScore` (0-100), `riskLevel` (LOW/MEDIUM/HIGH)
- Reminder tracking: `pollSentAt`, `confirmationDeadline`, `pollResponse`

**Waitlist**
- FIFO queue for fully booked time slots
- Position-based ordering
- Automatic offer generation with 24-hour expiration
- Includes `timezone` for offered slot emails

**ClientProfile** & **BusinessProfile**
- User role-based profile separation
- No-show/cancellation tracking for clients
- Business settings and preferences

**Service**
- Service offerings with duration and pricing
- Service-specific risk multipliers

## 🕐 Timezone Handling

The system is designed for global timezone support:

1. **Slot Generation** - Slots are generated in the user's local timezone (9 AM - 6 PM)
2. **UTC Storage** - All UTC times stored in database via Prisma's automatic conversion
3. **Email Display** - Emails show times in user's captured timezone using `Intl.DateTimeFormat`
4. **Conflict Detection** - Overlap checking done via UTC-to-UTC comparison

### Example
- User in EST (UTC-5) books 9 AM appointment on Feb 14
- Database stores: `2026-02-14T14:00:00Z` (14:00 UTC)
- Email displays: "February 14, 9:00 AM"
- Slot picker blocks: 9 AM local slot

## 📧 Email System

All emails are sent via SendGrid with timezone-aware formatting.

### Email Types
1. **Booking Confirmation** - Sent immediately upon appointment creation
2. **Appointment Reminder** - Sent 24-25 hours before appointment
3. **Waitlist Offer** - Sent when slot becomes available
4. **Verification Code** - Sent during signup

### Email Links
- Confirmation link: `https://app.com/api/appointment/confirm?token=...`
- Waitlist claim: `https://app.com/api/waitlist/claim?token=...`
- Waitlist decline: `https://app.com/api/waitlist/decline?token=...`

## ⏰ Cron Jobs

### Appointment Reminders (AWS Lambda)

**Schedule**: Every hour at the top of the hour (UTC)

**Triggers**:
```
- Appointment is 24-25 hours away
- Status is "confirmed"
- Reminder hasn't been sent yet (pollSentAt is null)
```

**Actions**:
1. Sends reminder email with timezone-aware formatting
2. Sets `pollSentAt` to current time
3. Sets `confirmationDeadline` to 2 hours before appointment

**Confirmation Flow**:
- If client doesn't confirm by deadline → appointment auto-cancels
- Next person in waitlist gets offered the slot
- Offer expires in 24 hours

### Deployment

Create Lambda function with Node.js 20 runtime:

```bash
# Install dependencies and generate Prisma client
npm install
npx prisma generate

# Create deployment package
zip -r function.zip index.mjs node_modules/

# Deploy
aws lambda create-function \
  --function-name appointment-reminders-cron \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT:role/LAMBDA_ROLE \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables='{
    "DATABASE_URL": "postgresql://...",
    "SENDGRID_API_KEY": "SG.xxx",
    "NEXTAUTH_URL": "https://app.vercel.app"
  }' \
  --vpc-config SubnetIds=subnet-xxx,SecurityGroupIds=sg-xxx
```

Create EventBridge rule:

```bash
aws events put-rule \
  --name appointment-reminders-hourly \
  --schedule-expression "cron(0 * * * ? *)"

aws events put-targets \
  --rule appointment-reminders-hourly \
  --targets "Id"="1","Arn"="arn:aws:lambda:region:account:function:appointment-reminders-cron"
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js handler
- `POST /api/register` - User registration
- `POST /api/verify` - Email verification

### Appointments
- `GET /api/appointment-data` - Get user's appointments
- `POST /api/appointment-data` - Create appointment
- `GET /api/appointment-data/[id]` - Get appointment details
- `GET /api/appointment/confirm?token=X` - Confirm attendance

### Availability
- `GET /api/businesses/[id]/available-slots?date=YYYY-MM-DD&timezone=America/New_York` - Get available slots

### Waitlist
- `GET /api/waitlist` - Get user's waitlist entries
- `POST /api/waitlist` - Join waitlist
- `GET /api/waitlist/claim?token=X` - Claim waitlist offer
- `GET /api/waitlist/decline?token=X` - Decline waitlist offer

### Business
- `GET /api/business/dashboard` - Business dashboard data
- `GET /api/business/appointments` - Business's appointments
- `POST /api/business/services` - Create service
- `GET /api/business/waitlist` - Business's waitlist

## 🔒 Environment Variables

### Production (.env for Vercel)
```env
DATABASE_URL=postgresql://...?schema=public&pgbouncer=true  # Transaction pooler (port 6543)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<random-secret>
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Lambda (.env for AWS Lambda)
```env
DATABASE_URL=postgresql://...?schema=public&pgbouncer=true  # Transaction pooler (port 6543)
NEXTAUTH_URL=https://yourdomain.com
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Note**: Use transaction pooler (port 6543) with `pgbouncer=true` for both Vercel and Lambda to avoid prepared statement cache issues.

## 🚢 Deployment

### Vercel (Frontend)
```bash
git push  # Automatically deploys on push to main branch
```

### AWS Lambda (Cron Jobs)
```bash
# After updating handler code:
npx prisma generate
zip -r function.zip index.mjs node_modules/
aws lambda update-function-code \
  --function-name appointment-reminders-cron \
  --zip-file fileb://function.zip
```

## 🐛 Troubleshooting

### "prepared statement s0 already exists"
- Use transaction pooler (port 6543) instead of direct connection (port 5432)
- Add `?pgbouncer=true` to DATABASE_URL
- Restart Lambda function after database URL change

### Emails not sending
- Verify SendGrid API key in environment variables
- Check CloudWatch logs: `aws logs tail /aws/lambda/appointment-reminders-cron`
- Ensure sender email is verified in SendGrid
- Verify `content` array is properly formatted in SendGrid request

### Timezone issues
- Verify appointment has `timezone` field in database
- Check slot picker sends timezone to API: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Verify `Intl.DateTimeFormat` works with timezone string in Lambda
- Test with appointment to verify email shows correct local time

### Lambda not triggering
- Verify EventBridge rule is enabled and has correct schedule: `cron(0 * * * ? *)`
- Check Lambda is in correct VPC with security group allowing outbound to database (port 6543)
- Verify IAM role has `lambda:InvokeFunction` permissions
- Check CloudWatch logs for invocation attempts

### Slot picker showing wrong times
- Ensure slot picker sends `timezone` parameter to API
- Verify appointment `timezone` field is stored in database
- Check available-slots API uses `UTC.getUTCOffsetHours()` correctly
- All slot times displayed should be in user's local timezone, not UTC

## 📊 Monitoring

### CloudWatch Logs
```bash
# Watch Lambda logs in real-time
aws logs tail /aws/lambda/appointment-reminders-cron --follow

# Filter for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/appointment-reminders-cron \
  --filter-pattern "ERROR"
```

### SendGrid Activity
- View sent emails: SendGrid Dashboard → Email Activity
- Check bounces and complaints: SendGrid Dashboard → Suppressions

### Database Metrics
- Supabase Dashboard → Database → Metrics
- Monitor connection pool usage (should stay < max_connections)
- Watch for slow queries in query logs

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

**Live Demo**: https://re-appoint-m6o6.vercel.app

**GitHub**: https://github.com/slayer1371/ReAppoint
