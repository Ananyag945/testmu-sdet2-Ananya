export interface MockResource {
  id: string;
  name: string;
  type: string;
  owner: string;
  itemsCount: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Shared in-memory mock database store.
 * Synchronizes resource state between API client operations and UI page renders.
 */
class MockDatabase {
  private resources: MockResource[] = [
    {
      id: "res-001",
      name: "Mock Baseline Suite",
      type: "automated",
      owner: "QA Core",
      itemsCount: 24,
    },
    {
      id: "res-002",
      name: "Legacy Sanity Checks",
      type: "manual",
      owner: "Product Team",
      itemsCount: 12,
    }
  ];

  public getResources(): MockResource[] {
    return [...this.resources];
  }

  public getResourceById(id: string): MockResource | undefined {
    return this.resources.find(r => r.id === id);
  }

  public addResource(resource: Omit<MockResource, 'id'>): MockResource {
    const newResource: MockResource = {
      id: `res-${Math.floor(100000 + Math.random() * 900000)}`,
      ...resource
    };
    this.resources.push(newResource);
    return newResource;
  }

  public updateResource(id: string, updates: Partial<MockResource>): MockResource | undefined {
    const resource = this.getResourceById(id);
    if (resource) {
      Object.assign(resource, updates);
      return resource;
    }
    return undefined;
  }

  public deleteResource(id: string): boolean {
    const initialLength = this.resources.length;
    this.resources = this.resources.filter(r => r.id !== id);
    return this.resources.length < initialLength;
  }

  public reset(): void {
    this.resources = [
      {
        id: "res-001",
        name: "Mock Baseline Suite",
        type: "automated",
        owner: "QA Core",
        itemsCount: 24,
      },
      {
        id: "res-002",
        name: "Legacy Sanity Checks",
        type: "manual",
        owner: "Product Team",
        itemsCount: 12,
      }
    ];
  }
}

export const mockDb = new MockDatabase();
