jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('../../models/User', () => ({ findById: jest.fn() }));
jest.mock('../../models/RefreshToken', () => ({ verifyToken: jest.fn() }));

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const { authenticateToken, verifyRefreshToken, optionalAuth } = require('../../middleware/auth');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const activeUser = { _id: 'user1', email: 'user@example.com', isActive: true, isLocked: false };

const namedError = (name, message) => {
  const error = new Error(message);
  error.name = name;
  return error;
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'access-secret';
  process.env.JWT_REFRESH_SECRET = 'refresh-secret';
});

describe('authenticateToken', () => {
  it('attaches the user and calls next for a valid cookie token', async () => {
    jwt.verify.mockReturnValue({ userId: 'user1' });
    User.findById.mockResolvedValue(activeUser);

    const req = { cookies: { accessToken: 'good-token' } };
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('good-token', 'access-secret');
    expect(req.user).toBe(activeUser);
    expect(req.token).toBe('good-token');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a request without a cookie token', async () => {
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken({ cookies: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required', code: 'NO_TOKEN' });
    expect(next).not.toHaveBeenCalled();
  });

  it('ignores an Authorization header (cookie-only auth)', async () => {
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken({ headers: { authorization: 'Bearer good-token' } }, res, next);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when the user no longer exists', async () => {
    jwt.verify.mockReturnValue({ userId: 'ghost' });
    User.findById.mockResolvedValue(null);
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken({ cookies: { accessToken: 'good-token' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid token - User not found or inactive',
      code: 'USER_INVALID'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an inactive user', async () => {
    jwt.verify.mockReturnValue({ userId: 'user1' });
    User.findById.mockResolvedValue({ ...activeUser, isActive: false });
    const res = makeRes();

    await authenticateToken({ cookies: { accessToken: 'good-token' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 423 for a locked account', async () => {
    jwt.verify.mockReturnValue({ userId: 'user1' });
    User.findById.mockResolvedValue({ ...activeUser, isLocked: true });
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken({ cookies: { accessToken: 'good-token' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(423);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Account is temporarily locked due to multiple failed login attempts',
      code: 'ACCOUNT_LOCKED'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 INVALID_TOKEN_FORMAT for a malformed token', async () => {
    jwt.verify.mockImplementation(() => { throw namedError('JsonWebTokenError', 'jwt malformed'); });
    const res = makeRes();

    await authenticateToken({ cookies: { accessToken: 'bad' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token format', code: 'INVALID_TOKEN_FORMAT' });
  });

  it('returns 403 TOKEN_EXPIRED for an expired token', async () => {
    jwt.verify.mockImplementation(() => { throw namedError('TokenExpiredError', 'jwt expired'); });
    const res = makeRes();

    await authenticateToken({ cookies: { accessToken: 'expired' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
  });

  it('returns 500 when the user lookup fails', async () => {
    jwt.verify.mockReturnValue({ userId: 'user1' });
    User.findById.mockRejectedValue(new Error('db down'));
    const res = makeRes();

    await authenticateToken({ cookies: { accessToken: 'good-token' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication server error', code: 'AUTH_ERROR' });
  });
});

describe('verifyRefreshToken', () => {
  it('attaches the user, token and token document for a valid refresh token', async () => {
    const tokenDoc = { _id: 'token1' };
    RefreshToken.verifyToken.mockResolvedValue(tokenDoc);
    jwt.verify.mockReturnValue({ userId: 'user1' });
    User.findById.mockResolvedValue(activeUser);

    const req = { cookies: { refreshToken: 'refresh-token' } };
    const res = makeRes();
    const next = jest.fn();

    await verifyRefreshToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('refresh-token', 'refresh-secret');
    expect(req.user).toBe(activeUser);
    expect(req.refreshToken).toBe('refresh-token');
    expect(req.refreshTokenDoc).toBe(tokenDoc);
    expect(next).toHaveBeenCalled();
  });

  it('rejects a request without a refresh token cookie', async () => {
    const res = makeRes();

    await verifyRefreshToken({ cookies: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token required', code: 'NO_REFRESH_TOKEN' });
  });

  it('rejects a token that is unknown or revoked in the database', async () => {
    RefreshToken.verifyToken.mockResolvedValue(null);
    const res = makeRes();

    await verifyRefreshToken({ cookies: { refreshToken: 'revoked' } }, res, jest.fn());

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  });

  it('rejects when the user is inactive', async () => {
    RefreshToken.verifyToken.mockResolvedValue({ _id: 'token1' });
    jwt.verify.mockReturnValue({ userId: 'user1' });
    User.findById.mockResolvedValue({ ...activeUser, isActive: false });
    const res = makeRes();

    await verifyRefreshToken({ cookies: { refreshToken: 'refresh-token' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid refresh token - User not found or inactive',
      code: 'USER_INVALID'
    });
  });

  it('maps jwt errors to 403 responses', async () => {
    RefreshToken.verifyToken.mockResolvedValue({ _id: 'token1' });
    jwt.verify.mockImplementation(() => { throw namedError('JsonWebTokenError', 'jwt malformed'); });
    const malformedRes = makeRes();
    await verifyRefreshToken({ cookies: { refreshToken: 'bad' } }, malformedRes, jest.fn());
    expect(malformedRes.status).toHaveBeenCalledWith(403);
    expect(malformedRes.json).toHaveBeenCalledWith({
      error: 'Invalid refresh token format',
      code: 'INVALID_REFRESH_TOKEN_FORMAT'
    });

    jwt.verify.mockImplementation(() => { throw namedError('TokenExpiredError', 'jwt expired'); });
    const expiredRes = makeRes();
    await verifyRefreshToken({ cookies: { refreshToken: 'expired' } }, expiredRes, jest.fn());
    expect(expiredRes.status).toHaveBeenCalledWith(403);
    expect(expiredRes.json).toHaveBeenCalledWith({
      error: 'Refresh token expired',
      code: 'REFRESH_TOKEN_EXPIRED'
    });
  });

  it('returns 500 on unexpected errors', async () => {
    RefreshToken.verifyToken.mockRejectedValue(new Error('db down'));
    const res = makeRes();

    await verifyRefreshToken({ cookies: { refreshToken: 'refresh-token' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token refresh server error', code: 'REFRESH_ERROR' });
  });
});

describe('optionalAuth', () => {
  it('continues without a user when no token is present', async () => {
    const req = { cookies: {} };
    const next = jest.fn();

    await optionalAuth(req, makeRes(), next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('attaches the user when the token is valid', async () => {
    jwt.verify.mockReturnValue({ userId: 'user1' });
    User.findById.mockResolvedValue(activeUser);
    const req = { cookies: { accessToken: 'good-token' } };
    const next = jest.fn();

    await optionalAuth(req, makeRes(), next);

    expect(req.user).toBe(activeUser);
    expect(req.token).toBe('good-token');
    expect(next).toHaveBeenCalled();
  });

  it('skips locked or inactive users but still continues', async () => {
    jwt.verify.mockReturnValue({ userId: 'user1' });
    User.findById.mockResolvedValue({ ...activeUser, isLocked: true });
    const req = { cookies: { accessToken: 'good-token' } };
    const next = jest.fn();

    await optionalAuth(req, makeRes(), next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('swallows verification errors and continues unauthenticated', async () => {
    jwt.verify.mockImplementation(() => { throw namedError('TokenExpiredError', 'jwt expired'); });
    const req = { cookies: { accessToken: 'expired' } };
    const res = makeRes();
    const next = jest.fn();

    await optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
