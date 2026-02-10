# Quickstart Guide: QR Host

**Date**: 2026-01-24  
**Feature**: QR Host

## Prerequisites

### Option 1: Docker (Recommended - Single Command Setup)

- Docker Desktop or Docker Engine 20.10+
- Docker Compose 2.0+

### Option 2: Manual Setup

- Node.js 20.x LTS or higher
- MongoDB 6.0+ (local or Atlas connection string)
- npm or yarn package manager

## Quick Start with Docker

### Single Command Setup

1. **Create `.env.local` file** (optional, defaults provided in docker-compose.yml):

```env
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

2. **Start everything with one command**:

```bash
docker-compose up
```

This will:
- Start MongoDB container on port 27017
- Start Next.js development server on port 3000
- Set up networking between services
- Mount volumes for hot reload

3. **Access the application**:

- Application: http://localhost:3000
- MongoDB: localhost:27017 (if you need direct access)

4. **Stop everything**:

```bash
docker-compose down
```

5. **Stop and remove volumes** (clean slate):

```bash
docker-compose down -v
```

### Docker Commands

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f mongodb

# Restart a service
docker-compose restart app

# Rebuild containers after dependency changes
docker-compose up --build

# Execute commands in container
docker-compose exec app npm run test
docker-compose exec mongodb mongosh -u admin -p adminpassword --authenticationDatabase admin
```

## Initial Setup (Manual)

### 1. Install Dependencies

```bash
npm install next@latest react@latest react-dom@latest
npm install typescript @types/node @types/react @types/react-dom
npm install mongoose next-auth@beta
npm install qrcode @types/qrcode
npm install sharp
npm install zod
npm install tailwindcss postcss autoprefixer
npm install @tanstack/react-query
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
```

### 2. Environment Variables

Create `.env.local` file:

```env
# Database (for manual setup)
MONGODB_URI=mongodb://localhost:27017/qr-platform
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/qr-platform

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# File Storage (optional, for cloud storage)
# AWS_S3_BUCKET=your-bucket-name
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# Or Vercel Blob:
# BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

**Note**: If using Docker, the MongoDB connection string is automatically configured in docker-compose.yml. You only need to set `NEXTAUTH_SECRET` in `.env.local` if you want to override the default.

### 3. Database Setup

Connect to MongoDB and create indexes:

```javascript
// Run in MongoDB shell or via migration script
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.qrcodes.createIndex({ userId: 1 });
db.qrcodes.createIndex({ status: 1 });
db.qrcodes.createIndex({ userId: 1, status: 1 });
db.qrcodeaccesses.createIndex({ qrCodeId: 1 });
db.qrcodeaccesses.createIndex({ timestamp: 1 });
db.qrcodeaccesses.createIndex({ qrCodeId: 1, timestamp: 1 });
db.hostedimages.createIndex({ userId: 1 });
```

### 4. Project Structure

Create the following directories:

```bash
mkdir -p app/api/{auth,qr,images,scan,admin}
mkdir -p app/{auth,dashboard,qr,admin}
mkdir -p lib/{db,models,qr,utils}
mkdir -p components/{ui,qr,admin,layout}
mkdir -p types
mkdir -p public/images
mkdir -p tests/{unit,integration,e2e}
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 2. Create First Admin User

Create a script `scripts/create-admin.ts`:

```typescript
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  await connectDB();
  
  const hashedPassword = await bcrypt.hash('admin-password', 10);
  
  const admin = new User({
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: hashedPassword,
    role: 'admin',
    qrCodeLimit: 100
  });
  
  await admin.save();
  console.log('Admin user created:', admin.email);
  process.exit(0);
}

createAdmin();
```

Run: `npx tsx scripts/create-admin.ts`

### 3. Test User Flow

1. **Sign Up**: Visit `/signup`, create account
2. **Create QR Code**: Visit `/dashboard/qr/create`, create QR with URL
3. **View QR Code**: Click on QR code in dashboard
4. **Scan QR Code**: Visit `/api/scan/[qr-code-id]` to test redirect
5. **View Analytics**: Visit `/dashboard/qr/[id]/analytics`

## Key Implementation Files

### Database Connection

`lib/db/mongodb.ts`:
```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

### NextAuth Configuration

`lib/auth.ts`:
```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials?.email });
        if (user && await bcrypt.compare(credentials?.password!, user.passwordHash)) {
          return { id: user._id.toString(), email: user.email, role: user.role };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
};

export default NextAuth(authOptions);
```

### QR Code Generation

`lib/qr/generator.ts`:
```typescript
import QRCode from 'qrcode';

export async function generateQRCode(data: string, size: number = 512): Promise<string> {
  return await QRCode.toDataURL(data, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M'
  });
}

export async function generateQRCodeBuffer(data: string, size: number = 512): Promise<Buffer> {
  return await QRCode.toBuffer(data, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M'
  });
}
```

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npx playwright test
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

- Ensure Node.js 20+ runtime
- Set environment variables
- Configure MongoDB connection
- Set up file storage (local or cloud)

## Common Issues

### MongoDB Connection

- Verify MONGODB_URI is correct
- Check network access to MongoDB
- Ensure MongoDB is running (if local)

### Image Upload Fails

- Check file size (max 2MB)
- Verify file format (JPEG/PNG only)
- Ensure write permissions for public/images directory

### QR Code Generation Fails

- Verify target URL is valid
- Check QR code library is installed
- Ensure sufficient memory for image generation

## Next Steps

1. Implement authentication pages (signup/signin)
2. Create dashboard layout
3. Implement QR code creation form
4. Build QR code list view
5. Add analytics visualization
6. Implement admin dashboard
