
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface UserProfile {
  name: string;
  mobile: string;
  role: UserRole;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum HUDState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING'
}

export interface AppConfig {
  introText: string;
  animationsEnabled: boolean;
  hudRotationSpeed: number;
}

export interface StoredUser {
  name: string;
  mobile: string;
  blocked: boolean;
}
