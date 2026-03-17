/**
 * Mock users for testing
 * These are fake users that don't require real database setup
 */

export const mockDJ = {
  email: 'test-dj@compakt.test',
  password: 'TestPassword123!',
  profile: {
    business_name: 'Test DJ',
    slug: 'test-dj',
    phone: '+972501234567',
    bio: 'Test DJ for automated testing',
    instagram: '@testdj',
    spotify: 'testdj',
  }
};

export const mockCouple = {
  email: 'couple@compakt.test',
  otp: '123456', // Mock OTP that always works in tests
  event: {
    name: 'Test Wedding',
    date: '2024-12-31',
    venue: 'Test Venue',
    guest_count: 150,
  }
};

export const mockStaff = {
  email: 'staff@compakt.test',
  password: 'StaffPassword123!',
  role: 'staff',
};

export const mockOwner = {
  email: 'owner@compakt.test',
  password: 'OwnerPassword123!',
  role: 'owner',
};

/**
 * Mock event data
 */
export const mockEvent = {
  token: 'test-event-123',
  name: 'Test Event',
  date: '2024-12-31',
  type: 'wedding',
};

/**
 * Mock questionnaire answers
 */
export const mockAnswers = {
  style: 'mixed',
  vibe: 'energetic',
  special_songs: ['Song 1', 'Song 2'],
};

/**
 * Mock song swipes
 */
export const mockSwipes = [
  { song_id: '1', action: 'like' as const },
  { song_id: '2', action: 'dislike' as const },
  { song_id: '3', action: 'super_like' as const },
];
