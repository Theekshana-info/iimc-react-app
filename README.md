# Isipathana International Meditation Center (IIMC)

A complete meditation center website built with React, TypeScript, and Supabase.

## Features

### Public Features
- **Home Page**: Hero section with upcoming events
- **About Page**: Center mission and vision with inline editing for admins
- **Events**: Browse and register for meditation sessions and workshops
- **Teachers**: View teacher profiles and specializations
- **Blog**: Read teachings and dharma talks
- **Contact**: Submit inquiries via contact form
- **Donate**: Support the center with donations

### User Features
- **Authentication**: Email/password signup and login with email verification
- **Profile Management**: Update personal information and phone number
- **Event Registration**: Register for events with payment integration
- **My Activities**: View registered events and active subscriptions
- **Theme Toggle**: Switch between light and dark mode

### Admin Features
- **Edit Mode**: Inline text editing for site content
- **Admin Dashboard**: Manage all site content
  - Events Manager: Create, edit, delete events
  - Blog Manager: Publish and manage blog posts
  - Teachers Manager: Add and update teacher profiles
  - Users Manager: View user details and roles
  - Messages Manager: Read and respond to contact messages
  - Donations Manager: View donation history
  - Settings Manager: Update site-wide settings

### Payment Integration
- **PayHere Integration**: Secure payment processing for event registrations and donations
- **Webhook Handler**: Automatic payment verification and status updates

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (customized)
- **State Management**: @tanstack/react-query
- **Routing**: react-router-dom
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)

## Setup Instructions

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Database Setup

The database is powered by Supabase. Ensure you run all migrations in the `supabase/migrations` folder to set up your tables, roles, and RLS policies.

To create an admin user:
1. Sign up for an account through the UI
2. Run this SQL in the Supabase SQL Editor:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('<your_user_id>', 'admin');
```

## PayHere Configuration

1. Get your PayHere credentials from https://payhere.lk
2. Add secrets to your Supabase project using the Supabase CLI:
```bash
npx supabase secrets set PAYHERE_MERCHANT_ID=your_id PAYHERE_MERCHANT_SECRET=your_secret
```
3. Configure PayHere webhook URL in your PayHere dashboard to point to your Supabase Edge Function `payhere_webhook_handler`.

## Deployment

1. Build the project:
```bash
npm run build
```
2. Deploy the `dist` folder to your preferred hosting provider (Vercel, Netlify, etc.).
3. Ensure all your environment variables are set in your hosting platform.

## Acknowledgments
Built with React, Supabase, shadcn/ui, and Tailwind CSS.
