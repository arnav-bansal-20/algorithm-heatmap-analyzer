/**
 * API Service for communicating with the FastAPI backend.
 * Uses Vite's /api proxy to target http://127.0.0.1:8000.
 */

export const api = {
  /**
   * Checks backend health status.
   */
  async checkHealth() {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error('API server returned error status');
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', message: error.message };
    }
  },

  /**
   * Runs benchmarks for selected algorithms, dataset type, and input sizes.
   * @param {string[]} algorithms 
   * @param {string} datasetType - random, sorted, reverse_sorted, nearly_sorted
   * @param {number[]} sizes - [10, 100, 1000, 10000, 100000]
   */
  async runBenchmark(algorithms, datasetType, sizes) {
    try {
      const response = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithms, dataset_type: datasetType, sizes })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to execute benchmarks');
      }
      return await response.json();
    } catch (error) {
      console.error('Benchmark execution failed:', error);
      throw error;
    }
  },

  /**
   * Performs ML curve fitting and extrapolations for an algorithm based on past benchmarks.
   * @param {string} algorithm 
   * @param {Array<{size: number, time_ms: number, operations: number}>} benchmarks 
   */
  async predictComplexity(algorithm, benchmarks) {
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm, benchmarks })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to fit complexity curves');
      }
      return await response.json();
    } catch (error) {
      console.error('Complexity prediction failed:', error);
      throw error;
    }
  },

  /**
   * Recommends the optimal algorithm for a given category, size, and constraints.
   * @param {string} category - sorting, searching, graph, string
   * @param {number} size 
   * @param {string} datasetType 
   * @param {string} memoryConstraint - low, medium, high
   */
  async getRecommendation(category, size, datasetType, memoryConstraint = 'high') {
    try {
      const query = new URLSearchParams({
        category,
        size: size.toString(),
        dataset_type: datasetType,
        memory_constraint: memoryConstraint
      });
      const response = await fetch(`/api/recommend?${query}`);
      if (!response.ok) throw new Error('Failed to get algorithm recommendation');
      return await response.json();
    } catch (error) {
      console.error('Recommendation fetching failed:', error);
      throw error;
    }
  },

  /**
   * Calls Gemini AI to analyze a specific benchmark result and generate educational insights.
   */
  async getGeminiExplanation(data, customApiKey = null) {
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithm_name: data.algorithm_name || data.algorithm,
          category: data.category,
          size: data.size,
          dataset_type: data.dataset_type || data.datasetType,
          time_ms: data.time_ms !== undefined ? data.time_ms : data.timeMs,
          operations: data.operations,
          memory_bytes: data.memory_bytes !== undefined ? data.memory_bytes : data.memoryBytes,
          recursion_depth: data.recursion_depth !== undefined ? data.recursion_depth : data.recursionDepth,
          predicted_complexity: data.predicted_complexity || data.predictedComplexity,
          custom_api_key: customApiKey || null
        })
      });
      if (!response.ok) throw new Error('Failed to get Gemini analysis');
      return await response.json();
    } catch (error) {
      console.error('Gemini explanation failed:', error);
      throw error;
    }
  },

  /**
   * Converses with the AI Study Companion.
   * @param {string} message 
   * @param {Array<{role: string, content: string}>} history 
   * @param {string} customCode 
   * @param {string[]} compareAlgorithms 
   * @param {string} customApiKey
   */
  async chatWithAI(message, history, customCode, compareAlgorithms, customApiKey = null) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history,
          custom_code: customCode || null,
          compare_algorithms: compareAlgorithms || [],
          custom_api_key: customApiKey || null
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to communicate with AI chat advisor');
      }
      return await response.json();
    } catch (error) {
      console.error('AI chat failed:', error);
      throw error;
    }
  }
};
