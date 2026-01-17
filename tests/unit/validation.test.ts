import {
  ValidationBounds,
  ValidationSchemas,
  validatePagination,
  validateSearchQuery,
  validateCartQuantity,
  validateProductId,
  validateOrderId,
  validatePrice,
  validateAddress,
  validateEmail,
  validateName,
  validateNumberBounds,
  validateStringLength,
  validateArrayLength,
  validateEnum,
} from "../../server/utils/validation";

/**
 * Unit tests for input validation utilities
 * Ensures all input bounds are enforced correctly
 */

describe("Input Validation Utilities", () => {
  describe("ValidationBounds Constants", () => {
    it("should define search bounds", () => {
      expect(ValidationBounds.search.minLength).toBe(1);
      expect(ValidationBounds.search.maxLength).toBe(200);
    });

    it("should define pagination bounds", () => {
      expect(ValidationBounds.pagination.limit.min).toBe(1);
      expect(ValidationBounds.pagination.limit.max).toBe(100);
      expect(ValidationBounds.pagination.limit.default).toBe(20);
    });

    it("should define cart bounds", () => {
      expect(ValidationBounds.cart.quantity.min).toBe(1);
      expect(ValidationBounds.cart.quantity.max).toBe(999);
    });
  });

  describe("Pagination Validation", () => {
    it("should validate valid pagination parameters", () => {
      const result = validatePagination(10, 0);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should use default values when parameters omitted", () => {
      const result = validatePagination();
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it("should reject limit below minimum", () => {
      expect(() => validatePagination(0, 0)).toThrow();
    });

    it("should reject limit above maximum", () => {
      expect(() => validatePagination(101, 0)).toThrow();
    });

    it("should reject negative offset", () => {
      expect(() => validatePagination(20, -1)).toThrow();
    });

    it("should reject offset above maximum", () => {
      expect(() => validatePagination(20, 10001)).toThrow();
    });

    it("should accept boundary values", () => {
      const result1 = validatePagination(1, 0);
      expect(result1.limit).toBe(1);

      const result2 = validatePagination(100, 10000);
      expect(result2.limit).toBe(100);
      expect(result2.offset).toBe(10000);
    });

    it("should coerce string numbers to integers", () => {
      const result = validatePagination("50", "10");
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(10);
    });
  });

  describe("Search Query Validation", () => {
    it("should accept valid search queries", () => {
      expect(validateSearchQuery("diamond ring")).toBe("diamond ring");
      expect(validateSearchQuery("engagement & wedding")).toBe("engagement & wedding");
    });

    it("should reject empty search", () => {
      expect(() => validateSearchQuery("")).toThrow();
    });

    it("should reject search exceeding max length", () => {
      const longSearch = "a".repeat(201);
      expect(() => validateSearchQuery(longSearch)).toThrow();
    });

    it("should accept max length search", () => {
      const maxSearch = "a".repeat(200);
      const result = validateSearchQuery(maxSearch);
      expect(result.length).toBe(200);
    });

    it("should reject special characters", () => {
      expect(() => validateSearchQuery("test@query")).toThrow();
      expect(() => validateSearchQuery("test#query")).toThrow();
    });

    it("should allow hyphens, ampersand, apostrophe, period", () => {
      expect(validateSearchQuery("gold-plated")).toBe("gold-plated");
      expect(validateSearchQuery("men's")).toBe("men's");
      expect(validateSearchQuery("14k.gold")).toBe("14k.gold");
    });

    it("should trim whitespace", () => {
      const result = validateSearchQuery("  search query  ");
      expect(result).toBe("search query");
    });
  });

  describe("Cart Quantity Validation", () => {
    it("should accept valid quantities", () => {
      expect(validateCartQuantity(1)).toBe(1);
      expect(validateCartQuantity(50)).toBe(50);
      expect(validateCartQuantity(999)).toBe(999);
    });

    it("should reject zero quantity", () => {
      expect(() => validateCartQuantity(0)).toThrow();
    });

    it("should reject negative quantity", () => {
      expect(() => validateCartQuantity(-1)).toThrow();
    });

    it("should reject quantity exceeding max", () => {
      expect(() => validateCartQuantity(1000)).toThrow();
    });

    it("should coerce string numbers", () => {
      expect(validateCartQuantity("50")).toBe(50);
    });

    it("should reject non-integer quantities", () => {
      expect(() => validateCartQuantity(50.5)).toThrow();
    });
  });

  describe("Product ID Validation", () => {
    it("should accept valid UUID format", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      expect(validateProductId(validUUID)).toBe(validUUID);
    });

    it("should reject invalid UUID format", () => {
      expect(() => validateProductId("not-a-uuid")).toThrow();
      expect(() => validateProductId("12345")).toThrow();
    });

    it("should reject empty string", () => {
      expect(() => validateProductId("")).toThrow();
    });
  });

  describe("Order ID Validation", () => {
    it("should accept valid order IDs", () => {
      expect(validateOrderId(1)).toBe(1);
      expect(validateOrderId(999999)).toBe(999999);
    });

    it("should reject zero", () => {
      expect(() => validateOrderId(0)).toThrow();
    });

    it("should reject negative numbers", () => {
      expect(() => validateOrderId(-1)).toThrow();
    });

    it("should coerce string numbers", () => {
      expect(validateOrderId("12345")).toBe(12345);
    });
  });

  describe("Price Validation", () => {
    it("should accept valid prices", () => {
      expect(validatePrice(99.99)).toBe(99.99);
      expect(validatePrice(0)).toBe(0);
      expect(validatePrice(999999.99)).toBe(999999.99);
    });

    it("should reject negative prices", () => {
      expect(() => validatePrice(-10)).toThrow();
    });

    it("should reject prices exceeding maximum", () => {
      expect(() => validatePrice(1000000)).toThrow();
    });
  });

  describe("Address Validation", () => {
    it("should accept valid address object", () => {
      const address = {
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
      };
      const result = validateAddress(address);
      expect(result.street).toBe("123 Main Street");
    });

    it("should reject address with missing fields", () => {
      const address = {
        street: "123 Main Street",
        city: "New York",
      };
      expect(() => validateAddress(address)).toThrow();
    });

    it("should reject street address too short", () => {
      const address = {
        street: "123",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
      };
      expect(() => validateAddress(address)).toThrow();
    });

    it("should reject city too short", () => {
      const address = {
        street: "123 Main Street",
        city: "N",
        state: "NY",
        zipCode: "10001",
        country: "USA",
      };
      expect(() => validateAddress(address)).toThrow();
    });
  });

  describe("Email Validation", () => {
    it("should accept valid emails", () => {
      expect(validateEmail("test@example.com")).toBe("test@example.com");
    });

    it("should reject invalid email format", () => {
      expect(() => validateEmail("not-an-email")).toThrow();
      expect(() => validateEmail("test@")).toThrow();
    });

    it("should reject emails exceeding max length", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      expect(() => validateEmail(longEmail)).toThrow();
    });
  });

  describe("Name Validation", () => {
    it("should accept valid names", () => {
      expect(validateName("John Doe")).toBe("John Doe");
      expect(validateName("A")).toBe("A");
    });

    it("should reject empty name", () => {
      expect(() => validateName("")).toThrow();
    });

    it("should reject names exceeding max length", () => {
      const longName = "a".repeat(101);
      expect(() => validateName(longName)).toThrow();
    });
  });

  describe("Generic Validation Functions", () => {
    describe("validateNumberBounds", () => {
      it("should accept numbers within bounds", () => {
        expect(validateNumberBounds(50, 1, 100, "Count")).toBe(50);
      });

      it("should reject numbers below minimum", () => {
        expect(() => validateNumberBounds(0, 1, 100, "Count")).toThrow();
      });

      it("should reject numbers above maximum", () => {
        expect(() => validateNumberBounds(101, 1, 100, "Count")).toThrow();
      });

      it("should reject non-numeric values", () => {
        expect(() => validateNumberBounds("abc", 1, 100, "Count")).toThrow();
      });
    });

    describe("validateStringLength", () => {
      it("should accept strings within bounds", () => {
        const result = validateStringLength("hello", 1, 10, "Text");
        expect(result).toBe("hello");
      });

      it("should reject strings too short", () => {
        expect(() => validateStringLength("hi", 5, 10, "Text")).toThrow();
      });

      it("should reject strings too long", () => {
        expect(() => validateStringLength("a".repeat(11), 1, 10, "Text")).toThrow();
      });
    });

    describe("validateArrayLength", () => {
      it("should accept arrays within bounds", () => {
        const result = validateArrayLength([1, 2, 3], 1, 5, "Items");
        expect(result).toEqual([1, 2, 3]);
      });

      it("should reject arrays too short", () => {
        expect(() => validateArrayLength([], 1, 5, "Items")).toThrow();
      });

      it("should reject arrays too long", () => {
        expect(() => validateArrayLength([1, 2, 3, 4, 5, 6], 1, 5, "Items")).toThrow();
      });
    });

    describe("validateEnum", () => {
      it("should accept valid enum values", () => {
        const result = validateEnum("active", ["active", "inactive"], "Status");
        expect(result).toBe("active");
      });

      it("should reject invalid enum values", () => {
        expect(() => validateEnum("unknown", ["active", "inactive"], "Status")).toThrow();
      });
    });
  });

  describe("Boundary Testing", () => {
    it("should accept exact minimum values", () => {
      expect(validatePagination(1, 0).limit).toBe(1);
      expect(validateCartQuantity(1)).toBe(1);
    });

    it("should accept exact maximum values", () => {
      expect(validatePagination(100, 10000).limit).toBe(100);
      expect(validatePagination(100, 10000).offset).toBe(10000);
      expect(validateCartQuantity(999)).toBe(999);
    });

    it("should reject one below minimum", () => {
      expect(() => validatePagination(0, 0)).toThrow();
      expect(() => validateCartQuantity(0)).toThrow();
    });

    it("should reject one above maximum", () => {
      expect(() => validatePagination(101, 0)).toThrow();
      expect(() => validateCartQuantity(1000)).toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should throw structured error objects", () => {
      try {
        validatePagination(101, 0);
      } catch (error: any) {
        expect(error.code).toBeTruthy();
        expect(error.message).toBeTruthy();
      }
    });

    it("should include field name in error", () => {
      try {
        validatePagination(101, 0);
      } catch (error: any) {
        expect(error.message).toContain("100");
      }
    });
  });

  describe("Security", () => {
    it("should prevent injection in search queries", () => {
      expect(() => validateSearchQuery("<script>alert('xss')</script>")).toThrow();
      expect(() => validateSearchQuery("'; DROP TABLE products;--")).toThrow();
    });

    it("should validate all numeric inputs", () => {
      expect(() => validateOrderId(-5)).toThrow();
      expect(() => validateOrderId(0)).toThrow();
    });

    it("should not allow negative pagination offsets", () => {
      expect(() => validatePagination(20, -100)).toThrow();
    });

    it("should enforce UUID format for product IDs", () => {
      expect(() => validateProductId("1; DELETE FROM products")).toThrow();
    });
  });
});
