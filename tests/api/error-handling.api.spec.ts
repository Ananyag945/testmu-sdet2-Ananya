import { test, expect } from '@playwright/test';
import { ApiClient, API_ENDPOINTS } from '../../src/api/ApiClient';
import payloads from '../../test-data/api-payloads.json';

test.describe('API Error Handling and Status Codes', () => {
  let apiClient: ApiClient;

  test.beforeEach(({ request }) => {
    apiClient = new ApiClient(request);
  });

  test('GET without Authorization header yields 401 Unauthorized @api', async () => {
    // Intentionally omit setting the Bearer auth token on ApiClient
    apiClient.clearAuthToken();

    const response = await apiClient.get(API_ENDPOINTS.RESOURCES);
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error || body.message).toBeDefined();
    expect(body.error || body.message).toMatch(/(unauthorized|auth|credentials|token)/i);
  });

  test('POST with missing required field yields 400 Bad Request @api', async () => {
    apiClient.setAuthToken('mock-authorized-jwt-token');
    
    // Select missing-field payload from invalid test payloads array
    const invalidPayload = payloads.invalid.find(p => p.description.includes('Missing required'));
    if (!invalidPayload) {
      throw new Error('Missing invalid payload in test-data fixture.');
    }

    const response = await apiClient.post(API_ENDPOINTS.RESOURCES, invalidPayload.payload);
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error || body.message).toBeDefined();
    expect(body.error || body.message).toMatch(/(required|missing|bad request|name)/i);
  });

  test('GET admin-only endpoint with Reader credentials yields 403 Forbidden @api', async () => {
    // Authenticate with token simulating reader access role limits
    apiClient.setAuthToken('mock-reader-role-jwt-token');

    const response = await apiClient.get(API_ENDPOINTS.ADMIN_DASHBOARD);
    expect(response.status()).toBe(403);

    const body = await response.json();
    expect(body.error || body.message).toBeDefined();
    expect(body.error || body.message).toMatch(/(forbidden|permission|denied|authorized|role)/i);
  });

  test('GET with non-existent resource ID yields 404 Not Found @api', async () => {
    apiClient.setAuthToken('mock-authorized-jwt-token');

    const response = await apiClient.get(API_ENDPOINTS.RESOURCE_BY_ID('nonexistent-id-00000'));
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.error || body.message).toBeDefined();
    expect(body.error || body.message).toMatch(/(not found|exist|resource)/i);
  });

  test('POST with semantically invalid payload (end date before start date) yields 422 Unprocessable Entity @api', async () => {
    apiClient.setAuthToken('mock-authorized-jwt-token');

    const semanticallyInvalidPayload = {
      name: "Date Failure Suite",
      type: "automated",
      owner: "QA Team",
      itemsCount: 5,
      startDate: "2026-05-25",
      endDate: "2026-05-20" // Chronological logical violation
    };

    const response = await apiClient.post(API_ENDPOINTS.RESOURCES, semanticallyInvalidPayload);
    expect(response.status()).toBe(422);

    const body = await response.json();
    expect(body.error || body.message).toBeDefined();
    expect(body.error || body.message).toMatch(/(date|semantic|unprocessable|validation|chronological|before)/i);
  });
});
