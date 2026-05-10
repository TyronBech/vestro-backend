import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/infrastructure/db/prisma.client';

describe('Authentication API Tests', () => {
  const app = createApp();
  let jwtToken: string;

  // 1. Before tests run, wipe the test database clean
  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  // 2. After all tests finish, disconnect the database
  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  // --- THE ACTUAL TESTS ---

  it('Should successfully create a new user and return a token', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'jest.test@vestro.com',
        password: 'SuperSecretPassword123!',
        firstName: 'Automated',
        lastName: 'Tester'
      });

    // We EXPECT a 201 Created status
    expect(response.status).toBe(201);
    
    // We EXPECT the response to contain a token
    expect(response.body.data).toHaveProperty('token');
    
    // We EXPECT the returned user email to match what we sent
    expect(response.body.data.user.email).toBe('jest.test@vestro.com');
  });

  it('Should reject a signup with an invalid email format (Zod Test)', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'not-an-email',
        password: 'SuperSecretPassword123!',
        firstName: 'Automated',
        lastName: 'Tester'
      });

    // We EXPECT the Zod middleware to block it with a 400 Bad Request
    expect(response.status).toBe(400);
    expect(response.body.errors[0].message).toContain('Invalid email');
  });

  it('Should successfully log in with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jest.test@vestro.com', // Using the user we created in Test 1
        password: 'SuperSecretPassword123!'
      });

    // We EXPECT a 200 OK status
    expect(response.status).toBe(200);
    
    // We EXPECT a token to be returned
    expect(response.body.data).toHaveProperty('token');

    // SAVE THE TOKEN FOR THE NEXT TEST
    jwtToken = response.body.data.token;
  });

  it('Should generate 2FA using the authenticated token', async () => {
    const response = await request(app)
      .post('/api/auth/2fa/generate')
      .set('Authorization', `Bearer ${jwtToken}`); // Injecting the Bouncer pass!

    // We EXPECT the Bouncer to let us in (200 OK)
    expect(response.status).toBe(200);
    
    // We EXPECT some 2FA data (like a QR code string) to be returned
    expect(response.body.data).toBeDefined();
  });

  it('Should block brute-force attacks via the Rate Limiter', async () => {
    // 1. Fire 10 rapid-fire bad login attempts (simulating a hacker)
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jest.test@vestro.com',
          password: 'WrongPassword123!' 
        });
    }

    // 2. The 11th attempt is the one that should hit the brick wall
    const blockedResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jest.test@vestro.com',
        password: 'WrongPassword123!'
      });

    // We EXPECT the HTTP status to be 429 Too Many Requests
    expect(blockedResponse.status).toBe(429);
    
    // We EXPECT our custom error code to match
    expect(blockedResponse.body.code).toBe('TOO_MANY_REQUESTS');
    expect(blockedResponse.body.message).toContain('Too many authentication attempts');
  });
});