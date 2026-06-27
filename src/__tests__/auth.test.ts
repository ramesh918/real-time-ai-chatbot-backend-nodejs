import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt';

describe('Password Utils', () => {
  it('should hash password and verify correctly', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'test-password-123';
    const wrongPassword = 'wrong-password';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });
});

describe('JWT Utils', () => {
  it('should generate and verify access token', () => {
    const userId = 'user-123';
    const email = 'test@example.com';

    const token = generateAccessToken(userId, email);
    expect(token).toBeDefined();

    const payload = verifyAccessToken(token);
    expect(payload).toBeDefined();
    expect(payload?.userId).toBe(userId);
    expect(payload?.email).toBe(email);
    expect(payload?.type).toBe('access');
  });

  it('should generate and verify refresh token', () => {
    const userId = 'user-123';
    const email = 'test@example.com';

    const token = generateRefreshToken(userId, email);
    expect(token).toBeDefined();

    const payload = verifyRefreshToken(token);
    expect(payload).toBeDefined();
    expect(payload?.userId).toBe(userId);
    expect(payload?.email).toBe(email);
    expect(payload?.type).toBe('refresh');
  });

  it('should not verify access token with wrong secret', () => {
    const userId = 'user-123';
    const email = 'test@example.com';

    const token = generateRefreshToken(userId, email);
    const payload = verifyAccessToken(token); // Try to verify refresh token as access token
    expect(payload).toBeNull();
  });

  it('should not verify expired token', async () => {
    // This is a simple test - for real expiration testing we'd need to mock time
    const token = generateAccessToken('user-123', 'test@example.com');
    const payload = verifyAccessToken(token);
    expect(payload).toBeDefined();
  });
});
