import { APIRequestContext, APIResponse } from '@playwright/test';
import { envConfig } from '../../config/env.config';
import { mockDb, MockResource } from '../utils/mockDb';

/**
 * Centrally managed REST API Endpoints.
 * Callers update these constants to match changes in the service contracts.
 */
export const API_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  RESOURCES: '/api/v1/resources',
  RESOURCE_BY_ID: (id: string) => `/api/v1/resources/${id}`,
  ADMIN_DASHBOARD: '/api/v1/admin/dashboard',
} as const;

/**
 * Mock APIResponse implementation to allow offline mock verification.
 * Implements the updated Playwright APIResponse interface.
 */
class MockAPIResponse implements APIResponse {
  private readonly _status: number;
  private readonly _body: any;
  private readonly _headers: Record<string, string>;

  constructor(status: number, body: any, headers: Record<string, string> = {}) {
    this._status = status;
    this._body = body;
    this._headers = { 'content-type': 'application/json', ...headers };
  }

  async body(): Promise<Buffer> {
    return Buffer.from(JSON.stringify(this._body));
  }

  headers(): Record<string, string> {
    return this._headers;
  }

  headersArray(): { name: string; value: string }[] {
    return Object.entries(this._headers).map(([name, value]) => ({ name, value }));
  }

  async json(): Promise<any> {
    return this._body;
  }

  ok(): boolean {
    return this._status >= 200 && this._status < 300;
  }

  status(): number {
    return this._status;
  }

  statusText(): string {
    const statusMap: Record<number, string> = {
      200: 'OK', 201: 'Created', 204: 'No Content',
      400: 'Bad Request', 401: 'Unauthorized',
      403: 'Forbidden', 404: 'Not Found', 422: 'Unprocessable Entity'
    };
    return statusMap[this._status] || 'Unknown';
  }

  async text(): Promise<string> {
    return JSON.stringify(this._body);
  }

  url(): string {
    return '';
  }

  async dispose(): Promise<void> {
    // No-op for mock lifecycle teardown
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.dispose();
  }
}

/**
 * ApiClient handles HTTP CRUD operations, wrapping Playwright's native APIRequestContext.
 * Implements a mock-fallback when API_BASE_URL points to placeholders (e.g. example.com).
 */
export class ApiClient {
  private readonly request: APIRequestContext;
  private readonly baseUrl: string;
  private authToken: string | null = null;
  private readonly isMockMode: boolean;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.baseUrl = envConfig.apiBaseUrl;
    this.isMockMode = this.baseUrl.includes('example.com');
  }

  public setAuthToken(token: string): void {
    this.authToken = token;
  }

  public clearAuthToken(): void {
    this.authToken = null;
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...extraHeaders,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Mock Router to handle direct local data queries.
   */
  private handleMockRequest(method: string, path: string, body?: any): MockAPIResponse {
    const headers = this.getHeaders();
    const authHeader = headers['Authorization'];

    // 1. Auth Endpoint: POST /api/v1/auth/login
    if (path === API_ENDPOINTS.LOGIN && method === 'POST') {
      if (!body || !body.email || !body.password) {
        return new MockAPIResponse(400, { error: "Missing email or password field." });
      }
      
      const validPasswords = ['securepassword', 'readerpassword', 'lockedpassword'];
      if (!validPasswords.includes(body.password)) {
        return new MockAPIResponse(401, { error: "Invalid credentials: password incorrect." });
      }

      if (body.email === 'locked@example.com') {
        return new MockAPIResponse(401, { error: "Account locked: contact admin." });
      }

      const role = body.email.includes('reader') ? 'reader' : 'admin';
      return new MockAPIResponse(200, {
        token: `mock-${role}-role-jwt-token`,
        expiresIn: 3600,
        user: { email: body.email, role }
      });
    }

    // 2. Admin Dashboard: GET /api/v1/admin/dashboard
    if (path === API_ENDPOINTS.ADMIN_DASHBOARD && method === 'GET') {
      if (!authHeader) {
        return new MockAPIResponse(401, { error: "Unauthorized: Token missing." });
      }
      if (authHeader.includes('reader')) {
        return new MockAPIResponse(403, { error: "Forbidden: Insufficient privileges." });
      }
      return new MockAPIResponse(200, { dashboardSignal: "Green", metrics: { activeUsers: 4 } });
    }

    // 3. Resources Endpoints
    if (path === API_ENDPOINTS.RESOURCES) {
      if (!authHeader) {
        return new MockAPIResponse(401, { error: "Unauthorized: Token missing." });
      }

      if (method === 'GET') {
        return new MockAPIResponse(200, mockDb.getResources());
      }

      if (method === 'POST') {
        if (!body || !body.name) {
          return new MockAPIResponse(400, { error: "Bad Request: required field name is missing." });
        }
        if (typeof body.itemsCount !== 'number') {
          return new MockAPIResponse(400, { error: "Bad Request: itemsCount must be a number." });
        }
        if (body.name.length > 150) {
          return new MockAPIResponse(400, { error: "Bad Request: name exceeds character limit." });
        }
        if (body.startDate && body.endDate && new Date(body.startDate) > new Date(body.endDate)) {
          return new MockAPIResponse(422, { error: "Semantic Error: endDate cannot be before startDate." });
        }

        const newRes = mockDb.addResource(body);
        return new MockAPIResponse(201, newRes);
      }
    }

    // 4. Resource by ID Endpoints
    const resourceIdMatch = path.match(/^\/api\/v1\/resources\/([^\/]+)$/);
    if (resourceIdMatch) {
      if (!authHeader) {
        return new MockAPIResponse(401, { error: "Unauthorized: Token missing." });
      }
      const resourceId = resourceIdMatch[1];

      if (resourceId === 'nonexistent-id-00000') {
        return new MockAPIResponse(404, { error: "Resource not found." });
      }

      if (method === 'GET') {
        const res = mockDb.getResourceById(resourceId);
        if (!res) return new MockAPIResponse(404, { error: "Resource not found." });
        return new MockAPIResponse(200, res);
      }

      if (method === 'PUT') {
        const updated = mockDb.updateResource(resourceId, body);
        if (!updated) return new MockAPIResponse(404, { error: "Resource not found." });
        return new MockAPIResponse(200, updated);
      }

      if (method === 'DELETE') {
        const deleted = mockDb.deleteResource(resourceId);
        if (!deleted) return new MockAPIResponse(404, { error: "Resource not found." });
        return new MockAPIResponse(204, null);
      }
    }

    return new MockAPIResponse(404, { error: "Not Found" });
  }

  public async get(path: string, headers?: Record<string, string>): Promise<APIResponse> {
    if (this.isMockMode) {
      return this.handleMockRequest('GET', path);
    }
    return this.request.get(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(headers),
    });
  }

  public async post(path: string, body: object, headers?: Record<string, string>): Promise<APIResponse> {
    if (this.isMockMode) {
      return this.handleMockRequest('POST', path, body);
    }
    return this.request.post(`${this.baseUrl}${path}`, {
      data: body,
      headers: this.getHeaders(headers),
    });
  }

  public async put(path: string, body: object, headers?: Record<string, string>): Promise<APIResponse> {
    if (this.isMockMode) {
      return this.handleMockRequest('PUT', path, body);
    }
    return this.request.put(`${this.baseUrl}${path}`, {
      data: body,
      headers: this.getHeaders(headers),
    });
  }

  public async delete(path: string, headers?: Record<string, string>): Promise<APIResponse> {
    if (this.isMockMode) {
      return this.handleMockRequest('DELETE', path);
    }
    return this.request.delete(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(headers),
    });
  }
}
