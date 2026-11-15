import { signToken, verifyToken } from '../src/auth';

describe('JWT authentication', () => {
  const oldSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = 'test-secret-with-more-than-24-characters'; });
  afterAll(() => { process.env.JWT_SECRET = oldSecret; });

  it('signs and verifies a user identity', () => {
    const token = signToken({ id: 'user-123', role: 'CUSTOMER' });
    expect(verifyToken(token)).toMatchObject({ sub: 'user-123', role: 'CUSTOMER' });
  });

  it('rejects a tampered token', () => {
    const token = signToken({ id: 'user-123', role: 'CUSTOMER' });
    expect(() => verifyToken(`${token.slice(0, -2)}xx`)).toThrow();
  });
});
