# Vercel Deployment Setup

## Environment Variables Required

Configure these in your Vercel dashboard under Settings > Environment Variables:

### Required Variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

### Optional Variables:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Database Setup

1. Make sure your database is accessible from Vercel
2. Run `npx prisma db push` to sync schema
3. Ensure DATABASE_URL is correctly set in Vercel

## Common Issues Fixed

- ✅ Bcrypt replaced with bcryptjs (no native dependencies)
- ✅ Prisma generate added to build command
- ✅ All TypeScript errors resolved
- ✅ Database schema updated with stock management
