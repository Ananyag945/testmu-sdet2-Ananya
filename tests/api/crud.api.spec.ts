import { test, expect } from '@playwright/test';
import { ApiClient, API_ENDPOINTS } from '../../src/api/ApiClient';
import { assertResponseSchema, assertResponseTime } from '../../src/utils/assertions';
import { z } from 'zod';
import payloads from '../../test-data/api-payloads.json';

// Zod Schema to validate Resource JSON responses
const ResourceResponseSchema = z.object({
  id: z.string().min(1, { message: 'ID must be present' }),
  name: z.string(),
  type: z.string(),
  owner: z.string(),
  itemsCount: z.number().int(),
});

test.describe('API CRUD Lifecycle', () => {
  let apiClient: ApiClient;
  const createdIds: string[] = [];

  test.beforeEach(({ request }) => {
    apiClient = new ApiClient(request);
    // Authenticate client for CRUD operations
    apiClient.setAuthToken('mock-authorized-jwt-token');
  });

  test.afterAll(async ({ request }) => {
    // Teardown: Clean up outstanding resources to guard against leaks on test failures
    const cleanupClient = new ApiClient(request);
    cleanupClient.setAuthToken('mock-authorized-jwt-token');
    
    for (const id of createdIds) {
      try {
        console.log(`🧹 [CRUD Cleanup] Tearing down resource ID: ${id}`);
        await cleanupClient.delete(API_ENDPOINTS.RESOURCE_BY_ID(id));
      } catch (err) {
        console.error(`❌ [CRUD Cleanup Error] Failed to delete resource ID: ${id}`, err);
      }
    }
  });

  // Parameterize over the 3 payloads defined in api-payloads.json
  const createPayloads = payloads.create;

  for (const [index, payload] of createPayloads.entries()) {
    test(`Verify complete CRUD lifecycle for payload #${index + 1}: ${payload.name} @api`, async () => {
      // 1. CREATE (POST)
      let startTime = Date.now();
      const createResponse = await apiClient.post(API_ENDPOINTS.RESOURCES, payload);
      assertResponseTime(startTime, 2000, `POST Create Resource #${index + 1}`);
      
      expect(createResponse.status()).toBe(201);
      const createdData = await createResponse.json();
      
      // Schema validation on create
      const validatedCreate = assertResponseSchema(createdData, ResourceResponseSchema);
      const resourceId = validatedCreate.id;
      createdIds.push(resourceId); // Track for safety cleanup

      expect(validatedCreate.name).toBe(payload.name);
      expect(validatedCreate.type).toBe(payload.type);

      // 2. READ (GET)
      startTime = Date.now();
      const readResponse = await apiClient.get(API_ENDPOINTS.RESOURCE_BY_ID(resourceId));
      assertResponseTime(startTime, 2000, `GET Read Resource ${resourceId}`);
      
      expect(readResponse.status()).toBe(200);
      const readData = await readResponse.json();
      
      // Schema validation on read
      const validatedRead = assertResponseSchema(readData, ResourceResponseSchema);
      expect(validatedRead.id).toBe(resourceId);
      expect(validatedRead.name).toBe(payload.name);

      // 3. UPDATE (PUT)
      const updatePayload = payloads.update;
      startTime = Date.now();
      const updateResponse = await apiClient.put(API_ENDPOINTS.RESOURCE_BY_ID(resourceId), updatePayload);
      assertResponseTime(startTime, 2000, `PUT Update Resource ${resourceId}`);
      
      expect(updateResponse.status()).toBe(200);
      const updatedData = await updateResponse.json();
      
      // Schema validation on update
      const validatedUpdate = assertResponseSchema(updatedData, ResourceResponseSchema);
      expect(validatedUpdate.id).toBe(resourceId);
      expect(validatedUpdate.name).toBe(updatePayload.name);
      expect(validatedUpdate.itemsCount).toBe(updatePayload.itemsCount);

      // 4. DELETE (DELETE)
      startTime = Date.now();
      const deleteResponse = await apiClient.delete(API_ENDPOINTS.RESOURCE_BY_ID(resourceId));
      assertResponseTime(startTime, 2000, `DELETE Resource ${resourceId}`);
      
      expect(deleteResponse.status()).toBe(204);

      // Remove from safety cleanup tracking list as it was deleted successfully in stream
      const idIndex = createdIds.indexOf(resourceId);
      if (idIndex > -1) {
        createdIds.splice(idIndex, 1);
      }
    });
  }
});
