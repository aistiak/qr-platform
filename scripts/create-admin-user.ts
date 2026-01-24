#!/usr/bin/env node

/**
 * Script to create an admin user from the terminal
 * 
 * Usage:
 *   tsx scripts/create-admin-user.ts
 *   tsx scripts/create-admin-user.ts --name "Admin User" --email "admin@example.com" --password "securepassword"
 *   tsx scripts/create-admin-user.ts --name "Admin User" --email "admin@example.com" --password "securepassword" --limit 100
 */

// Load environment variables from .env.local, .env, etc.
import dotenv from 'dotenv';
import { resolve } from 'path';

// Try to load .env.local first, then .env
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { connectDB } from '../lib/db/mongodb';
import User from '../lib/models/User';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

interface Args {
  name?: string;
  email?: string;
  password?: string;
  limit?: number;
}

function parseArgs(): Args {
  const args: Args = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--name' && argv[i + 1]) {
      args.name = argv[i + 1];
      i++;
    } else if (argv[i] === '--email' && argv[i + 1]) {
      args.email = argv[i + 1];
      i++;
    } else if (argv[i] === '--password' && argv[i + 1]) {
      args.password = argv[i + 1];
      i++;
    } else if (argv[i] === '--limit' && argv[i + 1]) {
      args.limit = parseInt(argv[i + 1], 10);
      i++;
    }
  }

  return args;
}

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function promptForInput(args: Args): Promise<{ name: string; email: string; password: string; limit: number }> {
  const rl = createReadlineInterface();

  try {
    const name = args.name || (await question(rl, 'Enter admin name: '));
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    const email = args.email || (await question(rl, 'Enter admin email: '));
    if (!email || email.trim().length === 0) {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    let password = args.password;
    if (!password) {
      password = await question(rl, 'Enter admin password: ');
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
    }

    const limitInput = args.limit !== undefined 
      ? args.limit.toString() 
      : await question(rl, 'Enter QR code limit (default: 20): ');
    const limit = limitInput ? parseInt(limitInput, 10) : 20;

    if (isNaN(limit) || limit < 1) {
      throw new Error('QR code limit must be a positive number');
    }

    return {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      limit,
    };
  } finally {
    rl.close();
  }
}

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...\n');

    // Parse command line arguments
    const args = parseArgs();

    // Prompt for missing information
    const { name, email, password, limit } = await promptForInput(args);

    // Connect to database
    console.log('\n📡 Connecting to database...');
    await connectDB();
    console.log('✅ Connected to database\n');

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`❌ User with email ${email} already exists.`);
      console.log(`   Current role: ${existingUser.role}`);
      
      if (existingUser.role === 'admin') {
        console.log('   User is already an admin.');
        process.exit(1);
      }

      // Ask if user wants to promote existing user to admin
      const rl = createReadlineInterface();
      const answer = await question(rl, '\n   Do you want to promote this user to admin? (yes/no): ');
      rl.close();

      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('   Operation cancelled.');
        process.exit(0);
      }

      // Update existing user to admin
      existingUser.role = 'admin';
      if (limit !== existingUser.qrCodeLimit) {
        existingUser.qrCodeLimit = limit;
      }
      await existingUser.save();

      console.log(`\n✅ User ${email} has been promoted to admin!`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   QR Code Limit: ${existingUser.qrCodeLimit}`);
      process.exit(0);
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = new User({
      name,
      email,
      passwordHash,
      role: 'admin',
      qrCodeLimit: limit,
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 User Details:');
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   QR Code Limit: ${adminUser.qrCodeLimit}`);
    console.log(`   Created: ${adminUser.createdAt}`);
    console.log('\n🎉 You can now sign in with this admin account!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error('   Unknown error occurred');
    }
    process.exit(1);
  }
}

// Run the script
createAdminUser();
