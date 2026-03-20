/**
 * Advanced session management for Compakt
 * Handles multi-device sync, refresh tokens, and long-term sessions
 */

import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceInfo: {
    deviceId: string;
    deviceType: string;
    browser: string;
    os: string;
    lastActive: string;
  };
  preferences: {
    language: string;
    theme: string;
    notifications: boolean;
  };
}

export interface RefreshTokenData {
  token: string;
  expiresAt: number;
  deviceId: string;
}

class SessionManager {
  private supabase: ReturnType<typeof createClient>;
  private sessions: Map<string, SessionInfo> = new Map();
  private refreshTokens: Map<string, RefreshTokenData> = new Map();

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Create a new session with device tracking
   */
  async createSession(session: Session, deviceInfo: Partial<SessionInfo['deviceInfo']>): Promise<SessionInfo> {
    const sessionId = this.generateSessionId();
    const deviceId = deviceInfo.deviceId || this.generateDeviceId();

    const sessionInfo: SessionInfo = {
      sessionId,
      userId: session.user.id,
      deviceInfo: {
        deviceId,
        deviceType: deviceInfo.deviceType || this.getDeviceType(),
        browser: deviceInfo.browser || this.getBrowser(),
        os: deviceInfo.os || this.getOS(),
        lastActive: new Date().toISOString(),
      },
      preferences: {
        language: 'he',
        theme: 'dark',
        notifications: true,
      },
    };

    // Store session in memory and database
    this.sessions.set(sessionId, sessionInfo);
    await this.saveSessionToDB(sessionInfo);

    // Set up refresh token
    await this.setupRefreshToken(session, deviceId);

    return sessionInfo;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionInfo | undefined> {
    // Check memory first
    let sessionInfo: SessionInfo | undefined = this.sessions.get(sessionId);

    if (!sessionInfo) {
      // Try to load from database
      sessionInfo = (await this.loadSessionFromDB(sessionId)) ?? undefined;
    }

    if (sessionInfo) {
      // Update last active time
      sessionInfo.deviceInfo.lastActive = new Date().toISOString();
      await this.updateSessionActivity(sessionInfo);
    }

    return sessionInfo ?? undefined;
  }

  /**
   * Refresh session using refresh token
   */
  async refreshSession(refreshToken: string, deviceId: string): Promise<Session | null> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({ refresh_token: refreshToken });

      if (error) {
        console.error('Session refresh failed:', error);
        return null;
      }

      // Update refresh token data
      this.refreshTokens.set(deviceId, {
        token: data.session?.refresh_token || '',
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        deviceId,
      });

      return data.session;
    } catch (error) {
      console.error('Session refresh error:', error);
      return null;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const userSessions: SessionInfo[] = [];

    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      const sessionInfo = this.sessions.get(sessionId);
      if (sessionInfo && sessionInfo.userId === userId) {
        userSessions.push(sessionInfo);
      }
    }

    // Also load from database for completeness
    const dbSessions = await this.loadUserSessionsFromDB(userId);
    dbSessions.forEach(session => {
      if (!this.sessions.has(session.sessionId)) {
        this.sessions.set(session.sessionId, session);
        userSessions.push(session);
      }
    });

    return userSessions.sort((a, b) =>
      new Date(b.deviceInfo.lastActive).getTime() - new Date(a.deviceInfo.lastActive).getTime()
    );
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const sessionInfo = this.sessions.get(sessionId);
      if (!sessionInfo) return false;

      // Remove from memory
      this.sessions.delete(sessionId);

      // Remove refresh token
      this.refreshTokens.delete(sessionInfo.deviceInfo.deviceId);

      // Remove from database
      await this.deleteSessionFromDB(sessionId);

      return true;
    } catch (error) {
      console.error('Failed to revoke session:', error);
      return false;
    }
  }

  /**
   * Revoke all sessions except current one
   */
  async revokeOtherSessions(currentSessionId: string): Promise<number> {
    const currentSession = this.sessions.get(currentSessionId);
    if (!currentSession) return 0;

    const userSessions = await this.getUserSessions(currentSession.userId);
    let revokedCount = 0;

    for (const session of userSessions) {
      if (session.sessionId !== currentSessionId) {
        if (await this.revokeSession(session.sessionId)) {
          revokedCount++;
        }
      }
    }

    return revokedCount;
  }

  /**
   * Update session preferences
   */
  async updatePreferences(sessionId: string, preferences: Partial<SessionInfo['preferences']>): Promise<boolean> {
    const sessionInfo = this.sessions.get(sessionId);
    if (!sessionInfo) return false;

    sessionInfo.preferences = { ...sessionInfo.preferences, ...preferences };
    await this.updateSessionInDB(sessionInfo);

    return true;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const expiredSessions: string[] = [];
    const now = Date.now();

    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      const sessionInfo = this.sessions.get(sessionId);
      if (!sessionInfo) continue;

      const lastActive = new Date(sessionInfo.deviceInfo.lastActive).getTime();
      const refreshToken = this.refreshTokens.get(sessionInfo.deviceInfo.deviceId);

      // Remove sessions inactive for more than 30 days or with expired refresh tokens
      if (now - lastActive > (30 * 24 * 60 * 60 * 1000) ||
        (refreshToken && refreshToken.expiresAt < now)) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.revokeSession(sessionId);
    }

    return expiredSessions.length;
  }

  // Private helper methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'server';

    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  private getBrowser(): string {
    if (typeof window === 'undefined') return 'server';

    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOS(): string {
    if (typeof window === 'undefined') return 'server';

    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private async setupRefreshToken(session: Session, deviceId: string): Promise<void> {
    if (session.refresh_token) {
      this.refreshTokens.set(deviceId, {
        token: session.refresh_token,
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        deviceId,
      });
    }
  }

  // Database operations (simplified - would implement actual Supabase calls)

  private async saveSessionToDB(sessionInfo: SessionInfo): Promise<void> {
    // Implementation would save to Supabase 'sessions' table
    console.log('Saving session to DB:', sessionInfo.sessionId);
  }

  private async loadSessionFromDB(sessionId: string): Promise<SessionInfo | null> {
    // Implementation would load from Supabase 'sessions' table
    console.log('Loading session from DB:', sessionId);
    return null;
  }

  private async loadUserSessionsFromDB(userId: string): Promise<SessionInfo[]> {
    // Implementation would load all user sessions from Supabase
    console.log('Loading user sessions from DB:', userId);
    return [];
  }

  private async updateSessionActivity(sessionInfo: SessionInfo): Promise<void> {
    // Implementation would update last_active in Supabase
    console.log('Updating session activity:', sessionInfo.sessionId);
  }

  private async updateSessionInDB(sessionInfo: SessionInfo): Promise<void> {
    // Implementation would update session in Supabase
    console.log('Updating session in DB:', sessionInfo.sessionId);
  }

  private async deleteSessionFromDB(sessionId: string): Promise<void> {
    // Implementation would delete session from Supabase
    console.log('Deleting session from DB:', sessionId);
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

// Export convenience functions
export const createSession = sessionManager.createSession.bind(sessionManager);
export const getSession = sessionManager.getSession.bind(sessionManager);
export const refreshSession = sessionManager.refreshSession.bind(sessionManager);
export const getUserSessions = sessionManager.getUserSessions.bind(sessionManager);
export const revokeSession = sessionManager.revokeSession.bind(sessionManager);
export const revokeOtherSessions = sessionManager.revokeOtherSessions.bind(sessionManager);
export const updatePreferences = sessionManager.updatePreferences.bind(sessionManager);
export const cleanupExpiredSessions = sessionManager.cleanupExpiredSessions.bind(sessionManager);
