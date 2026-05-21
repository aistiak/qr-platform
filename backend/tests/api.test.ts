import bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';

const TEST_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yF9cAAAAASUVORK5CYII=';

describe('Backend API integration', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;
  let User: any;
  let QRCode: any;
  let HostedImage: any;
  const uploadDir = path.join(process.cwd(), '.tmp-test-images');

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.SESSION_SECRET = 'test-session-secret';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.APP_URL = 'http://localhost:4000';
    process.env.IMAGE_UPLOAD_DIR = uploadDir;

    await fs.mkdir(uploadDir, { recursive: true });

    const serverModule = await import('../src/server');
    const modelsUser = await import('../src/models/User');
    const modelsQRCode = await import('../src/models/QRCode');
    const modelsHostedImage = await import('../src/models/HostedImage');
    const db = await import('../src/db/mongodb');

    app = serverModule.app;
    User = modelsUser.default;
    QRCode = modelsQRCode.default;
    HostedImage = modelsHostedImage.default;
    await db.connectDB();
  });

  beforeEach(async () => {
    await mongoose.connection.db?.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await fs.rm(uploadDir, { recursive: true, force: true });
  });

  const signUpAndSignIn = async (
    client: ReturnType<typeof request.agent>,
    payload: { name: string; email: string; password: string }
  ) => {
    const signUp = await client.post('/api/auth/signup').send(payload);
    expect(signUp.status).toBe(201);

    const signIn = await client
      .post('/api/auth/signin')
      .send({ email: payload.email, password: payload.password });
    expect(signIn.status).toBe(200);
  };

  it('handles auth lifecycle (signup, signin, session, signout)', async () => {
    const client = request.agent(app);
    await signUpAndSignIn(client, {
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123',
    });

    const session = await client.get('/api/auth/session');
    expect(session.status).toBe(200);
    expect(session.body.user.email).toBe('user1@example.com');

    const signOut = await client.post('/api/auth/signout');
    expect(signOut.status).toBe(200);

    const sessionAfter = await client.get('/api/auth/session');
    expect(sessionAfter.status).toBe(200);
    expect(sessionAfter.body).toBeNull();
  });

  it('handles QR CRUD and status endpoints', async () => {
    const client = request.agent(app);
    await signUpAndSignIn(client, {
      name: 'QR User',
      email: 'qr@example.com',
      password: 'password123',
    });

    const created = await client.post('/api/app/qr').send({
      customName: 'My QR',
      targetType: 'url',
      targetUrl: 'https://example.com',
    });
    expect(created.status).toBe(201);
    const qrId = created.body.id as string;

    const list = await client.get('/api/app/qr?status=all');
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);

    const details = await client.get(`/api/app/qr/${qrId}`);
    expect(details.status).toBe(200);
    expect(details.body.targetUrl).toBe('https://example.com');

    const updated = await client.patch(`/api/app/qr/${qrId}`).send({ customName: 'Updated QR' });
    expect(updated.status).toBe(200);
    expect(updated.body.customName).toBe('Updated QR');

    const analytics = await client.get(`/api/app/qr/${qrId}/analytics?period=day`);
    expect(analytics.status).toBe(200);
    expect(analytics.body.period).toBe('day');

    const downloaded = await client.get(`/api/app/qr/${qrId}/download?format=png`);
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers['content-type']).toContain('image/png');

    const paused = await client.post(`/api/app/qr/${qrId}/pause`);
    expect(paused.status).toBe(200);

    const resumed = await client.patch(`/api/app/qr/${qrId}`).send({ status: 'active' });
    expect(resumed.status).toBe(200);

    const archived = await client.post(`/api/app/qr/${qrId}/archive`);
    expect(archived.status).toBe(200);

    const deleted = await client.delete(`/api/app/qr/${qrId}`);
    expect(deleted.status).toBe(200);
  });

  it('supports API token management and scoped QR platform API', async () => {
    const client = request.agent(app);
    await signUpAndSignIn(client, {
      name: 'Token User',
      email: 'token@example.com',
      password: 'password123',
    });

    const tokenCreate = await client.post('/api/app/platform/tokens').send({
      name: 'Integration token',
      scopes: ['qr:create', 'qr:read', 'qr:list', 'qr:delete'],
    });
    expect(tokenCreate.status).toBe(201);
    expect(tokenCreate.body.token).toContain('qpt_');
    expect(tokenCreate.body.apiToken.name).toBe('Integration token');

    const apiToken = tokenCreate.body.token as string;
    const tokenId = tokenCreate.body.apiToken.id as string;

    const tokenList = await client.get('/api/app/platform/tokens');
    expect(tokenList.status).toBe(200);
    expect(tokenList.body.total).toBe(1);
    expect(Array.isArray(tokenList.body.availableScopes)).toBe(true);

    const tokenDetails = await client.get(`/api/app/platform/tokens/${tokenId}`);
    expect(tokenDetails.status).toBe(200);
    expect(tokenDetails.body.id).toBe(tokenId);

    const apiTokenCannotIssueToken = await request(app)
      .post('/api/app/platform/tokens')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        name: 'Should fail',
        scopes: ['qr:list'],
      });
    expect(apiTokenCannotIssueToken.status).toBe(401);

    const qrOne = await request(app)
      .post('/api/platform/qrs')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        customName: 'API QR 1',
        targetType: 'url',
        targetUrl: 'https://example.com/1',
      });
    expect(qrOne.status).toBe(201);

    const qrTwo = await request(app)
      .post('/api/platform/qrs')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        customName: 'API QR 2',
        targetType: 'url',
        targetUrl: 'https://example.com/2',
      });
    expect(qrTwo.status).toBe(201);

    const firstPage = await request(app)
      .get('/api/platform/qrs?status=all&limit=1')
      .set('Authorization', `Bearer ${apiToken}`);
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.total).toBe(1);
    expect(firstPage.body.hasMore).toBe(true);
    expect(firstPage.body.nextCursor).toBeTruthy();

    const secondPage = await request(app)
      .get(`/api/platform/qrs?status=all&limit=1&cursor=${encodeURIComponent(firstPage.body.nextCursor)}`)
      .set('Authorization', `Bearer ${apiToken}`);
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.total).toBe(1);

    const qrDetails = await request(app)
      .get(`/api/platform/qrs/${qrOne.body.id}`)
      .set('Authorization', `Bearer ${apiToken}`);
    expect(qrDetails.status).toBe(200);
    expect(qrDetails.body.id).toBe(qrOne.body.id);

    const deleted = await request(app)
      .delete(`/api/platform/qrs/${qrOne.body.id}`)
      .set('Authorization', `Bearer ${apiToken}`);
    expect(deleted.status).toBe(200);

    const limitedTokenCreate = await client.post('/api/app/platform/tokens').send({
      name: 'List only token',
      scopes: ['qr:list'],
    });
    expect(limitedTokenCreate.status).toBe(201);

    const listOnlyToken = limitedTokenCreate.body.token as string;
    const forbiddenCreate = await request(app)
      .post('/api/platform/qrs')
      .set('Authorization', `Bearer ${listOnlyToken}`)
      .send({
        customName: 'Should fail',
        targetType: 'url',
        targetUrl: 'https://example.com/forbidden',
      });
    expect(forbiddenCreate.status).toBe(403);

    const tokenDelete = await client.delete(`/api/app/platform/tokens/${tokenId}`);
    expect(tokenDelete.status).toBe(200);
  });

  it('handles image upload, image target QR, and scan redirect', async () => {
    const client = request.agent(app);
    await signUpAndSignIn(client, {
      name: 'Image User',
      email: 'image@example.com',
      password: 'password123',
    });

    const upload = await client
      .post('/api/images')
      .attach('file', Buffer.from(TEST_IMAGE_BASE64, 'base64'), {
        filename: 'pixel.png',
        contentType: 'image/png',
      });
    expect(upload.status).toBe(201);
    const hostedImageId = upload.body.id as string;

    const createQr = await client.post('/api/app/qr').send({
      customName: 'Image QR',
      targetType: 'image',
      hostedImageId,
    });
    expect(createQr.status).toBe(201);
    const qrId = createQr.body.id as string;

    const imageFetch = await request(app).get(`/api/images/${hostedImageId}`);
    expect(imageFetch.status).toBe(200);
    expect(imageFetch.headers['content-type']).toContain('image/png');

    const scan = await request(app).get(`/api/scan/${qrId}`);
    expect(scan.status).toBe(302);
    expect(scan.headers.location).toContain(`/c/${hostedImageId}`);

    // The redirected /c/:id path rewrites to /api/scan/:id, which should serve the image.
    const scanImageId = await request(app).get(`/api/scan/${hostedImageId}`);
    expect(scanImageId.status).toBe(200);
    expect(scanImageId.headers['content-type']).toContain('image/png');
  });

  it('blocks admin endpoints for non-admin users', async () => {
    const client = request.agent(app);
    await signUpAndSignIn(client, {
      name: 'Regular User',
      email: 'regular@example.com',
      password: 'password123',
    });

    const users = await client.get('/api/admin/users');
    expect(users.status).toBe(403);

    const qr = await client.get('/api/admin/qr');
    expect(qr.status).toBe(403);
  });

  it('allows admin users to manage admin endpoints', async () => {
    const adminPassword = await bcrypt.hash('adminpass123', 10);
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'admin',
      qrCodeLimit: 100,
    });
    const normalUser = await User.create({
      name: 'User A',
      email: 'usera@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'user',
      qrCodeLimit: 20,
    });

    const hostedImage = await HostedImage.create({
      userId: normalUser._id,
      filename: 'img.png',
      originalFilename: 'img.png',
      filePath: '/images/usera/img.png',
      mimeType: 'image/png',
      fileSize: 128,
      width: 1,
      height: 1,
    });

    await QRCode.create({
      userId: normalUser._id,
      customName: 'Admin List QR',
      targetType: 'image',
      hostedImageId: hostedImage._id,
      status: 'active',
      accessCount: 0,
    });

    const adminClient = request.agent(app);
    const adminSignIn = await adminClient
      .post('/api/auth/signin')
      .send({ email: 'admin@example.com', password: 'adminpass123' });
    expect(adminSignIn.status).toBe(200);

    const users = await adminClient.get('/api/admin/users');
    expect(users.status).toBe(200);
    expect(users.body.total).toBe(2);

    const updateUser = await adminClient
      .patch(`/api/admin/users/${normalUser._id.toString()}`)
      .send({ qrCodeLimit: 50 });
    expect(updateUser.status).toBe(200);
    expect(updateUser.body.qrCodeLimit).toBe(50);

    const qr = await adminClient.get('/api/admin/qr?status=all');
    expect(qr.status).toBe(200);
    expect(qr.body.total).toBe(1);
    expect(qr.body.qrCodes[0].user.email).toBe('usera@example.com');
    expect(admin._id).toBeDefined();
  });
});
