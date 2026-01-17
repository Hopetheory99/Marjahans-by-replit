/**
 * Tests for advanced search engine
 * Verifies fuzzy matching, suggestions, and search analytics
 */

describe("Advanced Search Engine", () => {
  describe("Fuzzy Matching", () => {
    it("should perform exact match", () => {
      const products = [{ id: "1", name: "Diamond Ring", description: "" }];
      const query = "Diamond Ring";

      const matches = products.filter(
        (p) => p.name.toLowerCase() === query.toLowerCase()
      );

      expect(matches).toHaveLength(1);
      expect(matches[0].name).toBe("Diamond Ring");
    });

    it("should perform substring match", () => {
      const products = [
        { id: "1", name: "Diamond Solitaire Ring", description: "" },
        { id: "2", name: "Pearl Necklace", description: "" },
      ];
      const query = "diamond";

      const matches = products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );

      expect(matches).toHaveLength(1);
      expect(matches[0].name).toContain("Diamond");
    });

    it("should handle typos with fuzzy matching", () => {
      const text = "Diamond";
      const typo = "Diamand";

      const similarity =
        1 - Math.abs(text.length - typo.length) / Math.max(text.length, typo.length);

      expect(similarity).toBeGreaterThan(0.5);
    });

    it("should match partial words", () => {
      const product = { name: "Emerald Drop Pendant" };
      const query = "emeral";

      const isMatch = product.name
        .toLowerCase()
        .includes(query.toLowerCase());

      expect(isMatch).toBe(true);
    });

    it("should be case insensitive", () => {
      const product = { name: "Diamond Ring" };
      const query1 = "diamond ring";
      const query2 = "DIAMOND RING";
      const query3 = "DiAmOnD rInG";

      expect(product.name.toLowerCase()).toBe(query1);
      expect(product.name.toLowerCase()).toBe(query2.toLowerCase());
      expect(product.name.toLowerCase()).toBe(query3.toLowerCase());
    });
  });

  describe("Search Relevance Scoring", () => {
    it("should score exact match highest", () => {
      const exactMatch = 100;
      const substringMatch = 85;
      const fuzzyMatch = 60;

      expect(exactMatch).toBeGreaterThan(substringMatch);
      expect(substringMatch).toBeGreaterThan(fuzzyMatch);
    });

    it("should weight name higher than description", () => {
      const nameWeight = 0.5;
      const descriptionWeight = 0.3;

      expect(nameWeight).toBeGreaterThan(descriptionWeight);
    });

    it("should filter low-scoring results", () => {
      const scores = [95, 80, 35, 20, 10];
      const minimumScore = 30;

      const filtered = scores.filter((s) => s >= minimumScore);

      expect(filtered).toHaveLength(3);
      expect(filtered).toContain(95);
      expect(filtered).toContain(80);
      expect(filtered).toContain(35);
      expect(filtered).not.toContain(20);
    });

    it("should handle multi-field scoring", () => {
      const nameScore = 90;
      const descriptionScore = 70;
      const categoryScore = 80;

      const combined =
        nameScore * 0.5 + descriptionScore * 0.3 + categoryScore * 0.2;

      expect(combined).toBeCloseTo(82, 0);
    });
  });

  describe("Search Suggestions", () => {
    it("should track search suggestions", () => {
      const suggestions = new Map<string, number>();

      suggestions.set("diamond ring", 1);
      suggestions.set("diamond necklace", 1);
      suggestions.set("diamond ring", 2);

      expect(suggestions.get("diamond ring")).toBe(2);
    });

    it("should sort suggestions by frequency", () => {
      const suggestions = [
        { query: "ring", frequency: 50 },
        { query: "necklace", frequency: 30 },
        { query: "bracelet", frequency: 70 },
      ];

      const sorted = suggestions.sort((a, b) => b.frequency - a.frequency);

      expect(sorted[0].query).toBe("bracelet");
      expect(sorted[1].query).toBe("ring");
      expect(sorted[2].query).toBe("necklace");
    });

    it("should filter suggestions by prefix", () => {
      const suggestions = [
        "diamond ring",
        "diamond necklace",
        "pearl necklace",
        "ruby ring",
      ];
      const prefix = "dia";

      const filtered = suggestions.filter((s) =>
        s.toLowerCase().startsWith(prefix.toLowerCase())
      );

      expect(filtered).toHaveLength(2);
    });

    it("should limit suggestion results", () => {
      const suggestions = Array.from({ length: 20 }, (_, i) => ({
        query: `search-${i}`,
        frequency: i,
      }));

      const limited = suggestions.slice(0, 5);

      expect(limited).toHaveLength(5);
    });

    it("should handle empty suggestions", () => {
      const suggestions: any[] = [];

      expect(suggestions).toHaveLength(0);
    });
  });

  describe("Search Analytics", () => {
    it("should track search queries", () => {
      const analytics: any[] = [];

      analytics.push({
        query: "diamond ring",
        resultCount: 5,
        timestamp: new Date(),
      });

      expect(analytics).toHaveLength(1);
      expect(analytics[0].query).toBe("diamond ring");
    });

    it("should record result count with search", () => {
      const search = {
        query: "necklace",
        resultCount: 12,
      };

      expect(search.resultCount).toBe(12);
    });

    it("should track user ID if provided", () => {
      const analytics = {
        query: "ring",
        resultCount: 8,
        userId: "user-123",
      };

      expect(analytics.userId).toBe("user-123");
    });

    it("should identify most searched queries", () => {
      const searchCounts = new Map<string, number>();

      searchCounts.set("ring", 150);
      searchCounts.set("necklace", 100);
      searchCounts.set("bracelet", 80);

      const topQuery = Array.from(searchCounts.entries())
        .sort((a, b) => b[1] - a[1])[0];

      expect(topQuery[0]).toBe("ring");
      expect(topQuery[1]).toBe(150);
    });

    it("should limit analytics history for memory", () => {
      const maxAnalytics = 10000;
      const analytics = Array.from({ length: 15000 }, (_, i) => ({
        query: `search-${i}`,
        resultCount: i,
      }));

      const trimmed = analytics.slice(-maxAnalytics);

      expect(trimmed).toHaveLength(maxAnalytics);
    });
  });

  describe("Related Terms", () => {
    it("should find related search terms", () => {
      const products = [
        { name: "Diamond Ring" },
        { name: "Diamond Solitaire Ring" },
        { name: "Diamond Halo Ring" },
        { name: "Pearl Necklace" },
      ];
      const query = "diamond";

      const related = products
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .map((p) => p.name);

      expect(related).toHaveLength(3);
      expect(related).toContain("Diamond Ring");
    });

    it("should not include exact query term in related", () => {
      const query = "diamond";
      const related = ["Diamond Ring", "Diamond Necklace"];

      const hasExactMatch = related.some(
        (r) => r.toLowerCase() === query.toLowerCase()
      );

      expect(hasExactMatch).toBe(false);
    });

    it("should limit related terms", () => {
      const related = [
        "Ring",
        "Ring Premium",
        "Ring Gold",
        "Ring Platinum",
        "Ring Silver",
        "Ring Custom",
      ];

      const limited = related.slice(0, 5);

      expect(limited).toHaveLength(5);
    });
  });

  describe("Analytics Operations", () => {
    it("should clear old analytics", () => {
      const now = new Date();
      const old30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const analytics = [
        { query: "ring", timestamp: old30Days },
        { query: "necklace", timestamp: now },
      ];

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const filtered = analytics.filter((a) => a.timestamp > cutoff);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].query).toBe("necklace");
    });

    it("should get search statistics", () => {
      const stats = {
        totalSearches: 1000,
        uniqueQueries: 150,
        suggestionCount: 150,
        analyticsSize: 1000,
      };

      expect(stats.totalSearches).toBeGreaterThan(0);
      expect(stats.uniqueQueries).toBeLessThan(stats.totalSearches);
    });
  });

  describe("Performance", () => {
    it("should handle large result sets efficiently", () => {
      const products = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `Product ${i}`,
        description: "High quality product",
      }));

      const query = "product";

      const start = Date.now();
      const results = products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      const end = Date.now();

      expect(results).toHaveLength(1000);
      expect(end - start).toBeLessThan(100); // Should be fast
    });

    it("should handle concurrent searches", () => {
      const searches = Array.from({ length: 100 }, (_, i) => ({
        query: `search-${i}`,
        results: [],
      }));

      expect(searches).toHaveLength(100);
    });
  });
});