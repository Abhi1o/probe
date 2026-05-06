import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface Config {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
  apiUrl?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.probe');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Get configuration
 */
export function getConfig(): Config {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading config:', error);
    return {};
  }
}

/**
 * Save configuration
 */
export function saveConfig(config: Config): void {
  ensureConfigDir();

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}

/**
 * Update configuration (merge with existing)
 */
export function updateConfig(updates: Partial<Config>): void {
  const current = getConfig();
  const updated = { ...current, ...updates };
  saveConfig(updated);
}

/**
 * Clear configuration
 */
export function clearConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}

/**
 * Get API URL from config or environment
 */
export function getApiUrl(): string {
  const config = getConfig();
  return config.apiUrl || process.env.PROBE_API_URL || 'http://localhost:3000/api/v1';
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  const config = getConfig();
  return !!config.accessToken;
}
