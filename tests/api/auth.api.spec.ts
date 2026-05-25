import { test, expect } from '@playwright/test';
import { ApiClient, API_ENDPOINTS } from '../../src/api/ApiClient';
import { assertResponseSchema, assertResponseTime } from '../../src/utils/assertions';
import { z } from 'zod';
import users from '../../test-data/users.json';

// Zod Schema to validate positive authentication response structure
const AuthResponseSchema = z.object({
  token: z.string().min(1, { message: 'Token cannot be empty' }),
  expiresIn: z.number().positive(),
  user: z.object({
    email: z.string().email(),
    role: z.string(),
  }),
});

test.describe('API Authentication Flows', () => {
  let apiClient: ApiClient;

  test.beforeEach(({ request }) => {
    apiClient = new ApiClient(request);
  });

  test('POST /api/v1/auth/login - Valid credentials yields 200 + Token @api', async () => {
    const successUser = users.find(u => u.expectedOutcome === 'success');
    if (!successUser) {
      throw new Error('No success scenario defined in users.json.');
    }

    const payload = {
      email: successUser.email,
      password: successUser.password,
    };

    const startTime = Date.now();
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, payload);
    assertResponseTime(startTime, 1000, 'POST Valid Login');

    expect(response.status()).toBe(200);

    const data = await response.json();
    
    // Schema verification
    const parsedData = assertResponseSchema(data, AuthResponseSchema);
    expect(parsedData.user.email).toBe(successUser.email);
    expect(parsedData.user.role).toBe(successUser.role);
  });

  test('POST /api/v1/auth/login - Invalid password yields 401 Unauthorized @api', async () => {
    const payload = {
      email: 'admin@example.com',
      password: 'incorrectpassword',
    };

    const startTime = Date.now();
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, payload);
    assertResponseTime(startTime, 1000, 'POST Invalid Login');

    expect(response.status()).toBe(401);
  });

  test('POST /api/v1/auth/login - Missing request body yields 400 Bad Request @api', async () => {
    const startTime = Date.now();
    // Sending empty body
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, {});
    assertResponseTime(startTime, 1000, 'POST Empty Login Body');

    expect(response.status()).toBe(400);
  });
});
