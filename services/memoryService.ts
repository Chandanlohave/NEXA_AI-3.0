
import { ChatMessage, StoredUser } from '../types';

const ADMIN_LOG_KEY = 'nexa_memory_admin_log';
const USER_LOGS_KEY = 'nexa_memory_user_logs';

// Helper to safely parse JSON from localStorage
const getJSON = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error parsing JSON from key ${key}:`, error);
    return defaultValue;
  }
};

// --- Admin Memory Functions ---

export const getAdminHistory = (): ChatMessage[] => {
  return getJSON<ChatMessage[]>(ADMIN_LOG_KEY, []);
};

export const saveAdminHistory = (history: ChatMessage[]): void => {
  localStorage.setItem(ADMIN_LOG_KEY, JSON.stringify(history));
};

// --- User Memory Functions ---

export const getUserHistory = (mobile: string): ChatMessage[] => {
  const allUserLogs = getJSON<Record<string, ChatMessage[]>>(USER_LOGS_KEY, {});
  return allUserLogs[mobile] || [];
};

export const saveUserHistory = (mobile: string, history: ChatMessage[]): void => {
  const allUserLogs = getJSON<Record<string, ChatMessage[]>>(USER_LOGS_KEY, {});
  allUserLogs[mobile] = history;
  localStorage.setItem(USER_LOGS_KEY, JSON.stringify(allUserLogs));
};

// --- Utility for Admin Panel ---

export const getCompleteUserLogs = (): Record<string, ChatMessage[]> => {
    return getJSON<Record<string, ChatMessage[]>>(USER_LOGS_KEY, {});
}
