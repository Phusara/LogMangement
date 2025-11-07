/**
 * Environment configuration and validation
 * Validates required environment variables at runtime
 */

const requiredEnvVars = ['VITE_API_BASE_URL']

/**
 * Validates that all required environment variables are present
 * @throws {Error} If a required environment variable is missing
 */
export function validateEnv() {
  const missing = requiredEnvVars.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value
 * @returns {string}
 */
export function getEnv(key, fallback = '') {
  return import.meta.env[key] || fallback
}

// Validate on module load
validateEnv()

/**
 * Environment configuration object
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
}
