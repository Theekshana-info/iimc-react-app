# Serenity Meditation Center

A complete meditation center website built with React, TypeScript, and Lovable Cloud (Supabase).

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
  - Donations Manager**: View donation history
  - Subscriptions Manager: Manage user subscriptions
  - Settings Manager: Update site-wide settings

### Payment Integration
- **PayHere Integration**: Secure payment processing for:
  - Event registrations
  - Donations
  - Subscription purchases
- **Webhook Handler**: Automatic payment verification and status updates

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (customized)
- **State Management**: @tanstack/react-query
- **Routing**: react-router-dom
- **Backend**: Lovable Cloud (Supabase)
  - PostgreSQL database
  - Row Level Security (RLS)
  - Edge Functions
  - Storage buckets
  - Authentication

## Design System

The site uses a meditation-inspired design with:
- **Colors**: Deep purples, soft lavenders, peaceful blue-greens
- **Gradients**: Subtle calming gradients throughout
- **Typography**: Clean, readable fonts
- **Animations**: Smooth transitions and hover effects
- **Shadows**: Soft shadows and glowing effects

All colors and styles are defined in `src/index.css` and `tailwind.config.ts` using HSL color tokens.

## Database Schema

### Tables
- `profiles`: User profile information
- `user_roles`: Role assignments (user, teacher, admin)
- `teachers`: Teacher profiles and specializations
- `events`: Meditation events and workshops
- `event_registrations`: User event registrations
- `bookings`: Teacher booking sessions
- `subscriptions`: User subscription plans
- `payments`: Payment records
- `messages`: Contact form submissions
- `blog_posts`: Blog articles
- `site_settings`: Configurable site content

### Security
- Row Level Security (RLS) enabled on all tables
- `is_admin()` helper function for admin checks
- Policies ensure users can only access their own data
- Admins have full access to manage content

## Environment Variables

The following are automatically configured by Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Required Secrets (added via Lovable Cloud)
- `PAYHERE_MERCHANT_ID`: PayHere merchant ID
- `PAYHERE_MERCHANT_SECRET`: PayHere merchant secret

## Setup Instructions

### Local Development

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

### Database Setup

The database is automatically configured via Lovable Cloud. All migrations are applied automatically.

To create an admin user:
1. Sign up for an account through the UI
2. Run this SQL in the Lovable Cloud database panel:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('<your_user_id>', 'admin');
```

### PayHere Configuration

1. Get your PayHere credentials from https://payhere.lk
2. Add secrets via Lovable Cloud:
   - Navigate to Settings > Secrets
   - Add `PAYHERE_MERCHANT_ID`
   - Add `PAYHERE_MERCHANT_SECRET`

3. Configure PayHere webhook URL:
   - In PayHere dashboard, set webhook URL to:
   - `https://<your-project-id>.supabase.co/functions/v1/payhere_webhook_handler`

### Authentication Setup

Email confirmation is recommended for production. To configure:
1. Go to Lovable Cloud > Authentication
2. Enable "Confirm Email" for signups
3. Configure email templates

For development, auto-confirm is enabled by default.

## Edge Functions

### create_payhere_order
Creates PayHere payment orders with SHA-1 hash generation.

**Endpoint**: `POST /functions/v1/create_payhere_order`

**Body**:
```json
{
  "amount": 1000,
  "orderId": "ORD123",
  "itemName": "Event Registration",
  "returnUrl": "https://yoursite.com/payment-result",
  "cancelUrl": "https://yoursite.com/payment-cancelled",
  "notifyUrl": "https://yoursite.com/webhook"
}
```

### payhere_webhook_handler
Handles PayHere payment notifications and updates payment records.

**Endpoint**: `POST /functions/v1/payhere_webhook_handler`

Automatically called by PayHere after payment completion.

## Deployment

### Via Lovable

1. Click "Publish" in the top right of the editor
2. Your site will be deployed with a custom URL
3. Configure custom domain in Settings > Domains (requires paid plan)

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

3. Ensure environment variables are set

## Project Structure

```
src/
├── components/
│   ├── Header.tsx           # Main navigation
│   ├── Footer.tsx           # Site footer
│   ├── Hero.tsx             # Homepage hero section
│   ├── EditableText.tsx     # Inline text editor for admins
│   ├── ThemeToggle.tsx      # Light/dark mode toggle
│   ├── admin/               # Admin dashboard components
│   └── ui/                  # shadcn UI components
├── context/
│   ├── ThemeContext.tsx     # Theme management
│   └── EditModeContext.tsx  # Admin edit mode
├── hooks/
│   ├── use-toast.ts         # Toast notifications
│   ├── useSetting.ts        # Site settings hook
│   └── use-mobile.ts        # Mobile detection
├── pages/
│   ├── Home.tsx             # Landing page
│   ├── About.tsx            # About page
│   ├── Events.tsx           # Events listing
│   ├── Contact.tsx          # Contact form
│   ├── Donate.tsx           # Donation page
│   ├── Auth.tsx             # Login/signup
│   ├── Profile.tsx          # User profile
│   └── NotFound.tsx         # 404 page
├── integrations/supabase/   # Auto-generated Supabase client
├── App.tsx                  # Main app with routing
├── index.css                # Design system tokens
└── main.tsx                 # App entry point

supabase/
└── functions/
    ├── create_payhere_order/     # Payment order creation
    └── payhere_webhook_handler/  # Payment webhook
```

## Key Features Implementation

### Inline Editing
Admins can toggle "Edit Mode" to edit site text inline. Uses the `EditableText` component connected to the `site_settings` table.

### Payment Flow
1. User selects donation amount or registers for event
2. Navigate to payment page with details
3. Create PayHere order via edge function
4. Redirect to PayHere payment gateway
5. PayHere processes payment
6. Webhook updates payment record
7. User redirected to success/failure page

### Security Best Practices
- Input validation using zod schemas
- RLS policies on all tables
- No sensitive data in client code
- Secrets managed via Lovable Cloud
- CORS properly configured on edge functions

## Testing

### Manual Testing Checklist

**Authentication**
- [ ] Sign up with email/password
- [ ] Email verification (if enabled)
- [ ] Sign in
- [ ] Sign out
- [ ] Profile update

**Events**
- [ ] View events list
- [ ] View event details
- [ ] Register for event
- [ ] Payment flow
- [ ] Registration appears in My Activities

**Admin**
- [ ] Enable edit mode
- [ ] Edit site text inline
- [ ] Access admin dashboard
- [ ] Create/edit/delete events
- [ ] View messages
- [ ] Manage users

**Payments**
- [ ] Donation flow
- [ ] Event registration payment
- [ ] PayHere integration
- [ ] Webhook processing
- [ ] Payment status updates

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Clear cache: `rm -rf node_modules .vite && npm install`
- Check TypeScript errors: `npm run typecheck`

### Database Issues
- Check RLS policies are correct
- Verify user is authenticated for protected routes
- Ensure migrations have run

### Payment Issues
- Verify PayHere credentials are correct
- Check webhook URL is configured
- Review edge function logs in Lovable Cloud

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

All rights reserved © 2025 Serenity Meditation Center

## Support

For issues or questions:
- Email: info@serenitymeditation.com
- Check documentation at https://docs.lovable.dev

## Acknowledgments

Built with:
- [Lovable](https://lovable.dev) - AI-powered development platform
- [Supabase](https://supabase.com) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
