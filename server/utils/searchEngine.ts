/**
 * Advanced Search Engine
 * Provides fuzzy search, autocomplete suggestions, and search analytics
 */

interface SearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  relevanceScore: number;
  searchContext: string;
}

interface SearchSuggestion {
  query: string;
  frequency: number;
  resultCount: number;
}

interface SearchAnalytics {
  query: string;
  resultCount: number;
  timestamp: Date;
  userId?: string;
}

class SearchEngine {
  private suggestions = new Map<string, SearchSuggestion>();
  private analytics: SearchAnalytics[] = [];
  private maxSuggestions = 100;

  /**
   * Levenshtein distance for fuzzy matching
   * Calculates similarity between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = Array(len2 + 1)
      .fill(null)
      .map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[len2][len1];
  }

  /**
   * Calculate fuzzy match score (0-100)
   * Higher score = better match
   */
  private calculateFuzzyScore(query: string, text: string): number {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    // Exact match gets highest score
    if (textLower === queryLower) return 100;

    // Substring match gets high score
    if (textLower.includes(queryLower)) {
      // Earlier position = higher score
      const position = textLower.indexOf(queryLower);
      return 85 - (position / textLower.length) * 10;
    }

    // Levenshtein distance for fuzzy match
    const distance = this.levenshteinDistance(queryLower, textLower);
    const maxLen = Math.max(queryLower.length, textLower.length);
    const similarity = 1 - distance / maxLen;

    return Math.max(0, similarity * 70);
  }

  /**
   * Search products with fuzzy matching
   */
  search(
    query: string,
    products: any[],
    userId?: string
  ): SearchResult[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();

    // Score all products
    const scoredProducts = products
      .map((product) => {
        // Calculate scores for different fields
        const nameScore = this.calculateFuzzyScore(cleanQuery, product.name);
        const descriptionScore = this.calculateFuzzyScore(
          cleanQuery,
          product.description || ""
        );
        const categoryScore = this.calculateFuzzyScore(
          cleanQuery,
          product.category || ""
        );

        // Combine scores with weights
        const relevanceScore =
          nameScore * 0.5 + descriptionScore * 0.3 + categoryScore * 0.2;

        return {
          ...product,
          relevanceScore,
          searchContext: product.name,
        };
      })
      // Filter results with minimum score
      .filter((p) => p.relevanceScore >= 30)
      // Sort by relevance
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Track analytics
    this.recordSearch(cleanQuery, scoredProducts.length, userId);

    // Track suggestion
    this.addSuggestion(cleanQuery, scoredProducts.length);

    return scoredProducts;
  }

  /**
   * Get search suggestions based on previous searches
   */
  getSuggestions(prefix: string, limit: number = 5): SearchSuggestion[] {
    const prefixLower = prefix.toLowerCase();

    return Array.from(this.suggestions.values())
      .filter((s) => s.query.startsWith(prefixLower))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Get related search terms (products with similar names)
   */
  getRelatedTerms(query: string, products: any[]): string[] {
    const cleanQuery = query.toLowerCase();
    const related = new Set<string>();

    products.forEach((product) => {
      const productName = product.name.toLowerCase();
      const score = this.calculateFuzzyScore(cleanQuery, productName);

      if (score >= 40 && productName !== cleanQuery) {
        related.add(product.name);
      }
    });

    return Array.from(related).slice(0, 5);
  }

  /**
   * Add search to suggestions
   */
  private addSuggestion(query: string, resultCount: number): void {
    const existing = this.suggestions.get(query);

    if (existing) {
      existing.frequency++;
      existing.resultCount = resultCount;
    } else {
      if (this.suggestions.size >= this.maxSuggestions) {
        // Remove least frequent suggestion
        let minKey = "";
        let minFreq = Infinity;

        this.suggestions.forEach((value, key) => {
          if (value.frequency < minFreq) {
            minFreq = value.frequency;
            minKey = key;
          }
        });

        this.suggestions.delete(minKey);
      }

      this.suggestions.set(query, {
        query,
        frequency: 1,
        resultCount,
      });
    }
  }

  /**
   * Record search analytics
   */
  private recordSearch(
    query: string,
    resultCount: number,
    userId?: string
  ): void {
    this.analytics.push({
      query,
      resultCount,
      timestamp: new Date(),
      userId,
    });

    // Keep only last 10k searches for memory efficiency
    if (this.analytics.length > 10000) {
      this.analytics = this.analytics.slice(-10000);
    }
  }

  /**
   * Get search analytics
   */
  getAnalytics(limit: number = 100) {
    const topQueries = new Map<string, number>();

    this.analytics.forEach((entry) => {
      const count = topQueries.get(entry.query) || 0;
      topQueries.set(entry.query, count + 1);
    });

    return Array.from(topQueries.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get most searched products
   */
  getMostSearchedCategories(limit: number = 10) {
    const categories = new Map<string, number>();

    this.analytics.forEach((entry) => {
      const category = entry.query.split(" ")[0];
      const count = categories.get(category) || 0;
      categories.set(category, count + 1);
    });

    return Array.from(categories.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Clear old analytics (older than n days)
   */
  clearOldAnalytics(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const beforeCount = this.analytics.length;
    this.analytics = this.analytics.filter((a) => a.timestamp > cutoffDate);

    return beforeCount - this.analytics.length;
  }

  /**
   * Get search engine statistics
   */
  getStats() {
    return {
      totalSearches: this.analytics.length,
      uniqueQueries: this.suggestions.size,
      suggestionCount: this.suggestions.size,
      analyticsSize: this.analytics.length,
    };
  }
}

export default SearchEngine;
