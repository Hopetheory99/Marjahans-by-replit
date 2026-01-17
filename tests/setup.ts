/**
 * Test setup and configuration
 * Initializes mock database and test utilities
 */

// Suppress console logs during tests unless explicitly needed
const originalLog = console.log;
const originalWarn = console.warn;

beforeAll(() => {
  // Keep errors visible
});

afterEach(() => {
  jest.clearAllMocks();
});

// Helper to create mock request with user context
export function createMockRequest(userId: string = "test-user") {
  return {
    user: {
      claims: {
        sub: userId,
      },
    },
    protocol: "http",
    get: (header: string) => {
      if (header === "host") return "localhost:5000";
      return undefined;
    },
    query: {},
    body: {},
  };
}

// Helper to create mock response
export function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    statusCode: 200,
  };
  return res as any;
}

// Helper to wait for async operations
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
