import { z } from "zod";

/**
 * Input Validation Utilities
 * Provides validation bounds and helpers for strong input validation
 */

/**
 * Validation bounds for common input types
 * Enforces reasonable limits to prevent abuse and server resource exhaustion
 */
export const ValidationBounds = {
  // Search parameters
  search: {
    minLength: 1,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-&\'\.]+$/, // Alphanumeric, spaces, dash, ampersand, apostrophe, period
  },

  // Pagination
  pagination: {
    limit: {
      min: 1,
      max: 100,
      default: 20,
    },
    offset: {
      min: 0,
      max: 10000,
      default: 0,
    },
  },

  // Cart
  cart: {
    quantity: {
      min: 1,
      max: 999,
    },
  },

  // Product prices
  price: {
    min: 0,
    max: 999999.99, // Max $999,999.99
  },

  // Addresses
  address: {
    street: {
      minLength: 5,
      maxLength: 100,
    },
    city: {
      minLength: 2,
      maxLength: 50,
    },
    state: {
      minLength: 2,
      maxLength: 50,
    },
    zipCode: {
      minLength: 5,
      maxLength: 20,
    },
    country: {
      minLength: 2,
      maxLength: 50,
    },
  },

  // User data
  name: {
    minLength: 1,
    maxLength: 100,
  },
  email: {
    maxLength: 254, // RFC 5321
  },

  // Product data
  productName: {
    minLength: 3,
    maxLength: 200,
  },
  productDescription: {
    maxLength: 5000,
  },

  // Text fields
  text: {
    maxLength: 10000,
  },
} as const;

/**
 * Zod schemas for common validation patterns
 */
export const ValidationSchemas = {
  // Pagination parameters
  pagination: z.object({
    limit: z
      .coerce
      .number()
      .int("Limit must be an integer")
      .min(ValidationBounds.pagination.limit.min, "Limit must be at least 1")
      .max(ValidationBounds.pagination.limit.max, "Limit cannot exceed 100"),
    offset: z
      .coerce
      .number()
      .int("Offset must be an integer")
      .min(ValidationBounds.pagination.offset.min, "Offset cannot be negative")
      .max(ValidationBounds.pagination.offset.max, "Offset cannot exceed 10000"),
  }),

  // Search query
  searchQuery: z
    .string()
    .trim()
    .min(ValidationBounds.search.minLength, "Search term must not be empty")
    .max(ValidationBounds.search.maxLength, "Search term must not exceed 200 characters")
    .refine(
      (val) => ValidationBounds.search.pattern.test(val),
      "Search term contains invalid characters"
    ),

  // Cart quantity
  cartQuantity: z
    .coerce
    .number()
    .int()
    .min(ValidationBounds.cart.quantity.min, "Quantity must be at least 1")
    .max(ValidationBounds.cart.quantity.max, "Quantity cannot exceed 999"),

  // Product ID (UUID format)
  productId: z
    .string()
    .uuid("Invalid product ID format"),

  // Order ID
  orderId: z
    .coerce
    .number()
    .int()
    .positive("Invalid order ID"),

  // Price
  price: z
    .coerce
    .number()
    .min(ValidationBounds.price.min, "Price cannot be negative")
    .max(ValidationBounds.price.max, "Price exceeds maximum allowed"),

  // Address
  address: z.object({
    street: z
      .string()
      .min(ValidationBounds.address.street.minLength)
      .max(ValidationBounds.address.street.maxLength),
    city: z
      .string()
      .min(ValidationBounds.address.city.minLength)
      .max(ValidationBounds.address.city.maxLength),
    state: z
      .string()
      .min(ValidationBounds.address.state.minLength)
      .max(ValidationBounds.address.state.maxLength),
    zipCode: z
      .string()
      .min(ValidationBounds.address.zipCode.minLength)
      .max(ValidationBounds.address.zipCode.maxLength),
    country: z
      .string()
      .min(ValidationBounds.address.country.minLength)
      .max(ValidationBounds.address.country.maxLength),
  }),

  // Email
  email: z
    .string()
    .email("Invalid email format")
    .max(ValidationBounds.email.maxLength),

  // Name
  name: z
    .string()
    .min(ValidationBounds.name.minLength, "Name is required")
    .max(ValidationBounds.name.maxLength, "Name is too long"),

  // Product name
  productName: z
    .string()
    .min(ValidationBounds.productName.minLength)
    .max(ValidationBounds.productName.maxLength),

  // Product description
  productDescription: z
    .string()
    .max(ValidationBounds.productDescription.maxLength),
};

/**
 * Validate pagination parameters from query string
 */
export function validatePagination(limit?: any, offset?: any): { limit: number; offset: number } {
  try {
    const limitValue = limit !== undefined && limit !== null ? limit : ValidationBounds.pagination.limit.default;
    const offsetValue = offset !== undefined && offset !== null ? offset : ValidationBounds.pagination.offset.default;
    
    const result = ValidationSchemas.pagination.parse({
      limit: limitValue,
      offset: offsetValue,
    });
    return {
      limit: result.limit,
      offset: result.offset,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "INVALID_PAGINATION",
        message: error.errors[0].message,
        field: error.errors[0].path.join("."),
      };
    }
    throw error;
  }
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): string {
  try {
    return ValidationSchemas.searchQuery.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "INVALID_SEARCH_QUERY",
        message: error.errors[0].message,
      };
    }
    throw error;
  }
}

/**
 * Validate cart quantity
 */
export function validateCartQuantity(quantity: any): number {
  try {
    return ValidationSchemas.cartQuantity.parse(quantity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "INVALID_QUANTITY",
        message: error.errors[0].message,
      };
    }
    throw error;
  }
}

/**
 * Validate product ID (UUID format)
 */
export function validateProductId(id: string): string {
  try {
    return ValidationSchemas.productId.parse(id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "INVALID_PRODUCT_ID",
        message: error.errors[0].message,
      };
    }
    throw error;
  }
}

/**
 * Validate order ID
 */
export function validateOrderId(id: any): number {
  try {
    return ValidationSchemas.orderId.parse(id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "INVALID_ORDER_ID",
        message: error.errors[0].message,
      };
    }
    throw error;
  }
}

/**
 * Validate price
 */
export function validatePrice(price: any): number {
  try {
    return ValidationSchemas.price.parse(price);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "INVALID_PRICE",
        message: error.errors[0].message,
      };
    }
    throw error;
  }
}

/**
 * Validate address object
 */
export function validateAddress(address: any) {
  try {
    return ValidationSchemas.address.parse(address);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "INVALID_ADDRESS",
        message: error.errors[0].message,
        field: error.errors[0].path.join("."),
      };
    }
    throw error;
  }
}

/**
 * Validate email
 */
export function validateEmail(email: string): string {
  try {
    return ValidationSchemas.email.parse(email);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "INVALID_EMAIL",
        message: error.errors[0].message,
      };
    }
    throw error;
  }
}

/**
 * Validate name
 */
export function validateName(name: string): string {
  try {
    return ValidationSchemas.name.parse(name);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "INVALID_NAME",
        message: error.errors[0].message,
      };
    }
    throw error;
  }
}

/**
 * Validate numeric string is within bounds
 */
export function validateNumberBounds(
  value: any,
  min: number,
  max: number,
  fieldName: string
): number {
  const num = Number(value);

  if (isNaN(num)) {
    throw {
      code: "INVALID_NUMBER",
      message: `${fieldName} must be a valid number`,
    };
  }

  if (num < min) {
    throw {
      code: "VALUE_TOO_LOW",
      message: `${fieldName} must be at least ${min}`,
    };
  }

  if (num > max) {
    throw {
      code: "VALUE_TOO_HIGH",
      message: `${fieldName} cannot exceed ${max}`,
    };
  }

  return num;
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): string {
  if (value.length < minLength) {
    throw {
      code: "STRING_TOO_SHORT",
      message: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (value.length > maxLength) {
    throw {
      code: "STRING_TOO_LONG",
      message: `${fieldName} cannot exceed ${maxLength} characters`,
    };
  }

  return value;
}

/**
 * Validate array length
 */
export function validateArrayLength(
  array: any[],
  minLength: number,
  maxLength: number,
  fieldName: string
): any[] {
  if (array.length < minLength) {
    throw {
      code: "ARRAY_TOO_SHORT",
      message: `${fieldName} must have at least ${minLength} items`,
    };
  }

  if (array.length > maxLength) {
    throw {
      code: "ARRAY_TOO_LONG",
      message: `${fieldName} cannot have more than ${maxLength} items`,
    };
  }

  return array;
}

/**
 * Validate value is one of allowed values
 */
export function validateEnum(
  value: any,
  allowedValues: string[],
  fieldName: string
): string {
  if (!allowedValues.includes(value)) {
    throw {
      code: "INVALID_ENUM",
      message: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
    };
  }

  return value;
}
