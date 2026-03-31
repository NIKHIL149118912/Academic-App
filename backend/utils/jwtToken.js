/**
 * JWT Token Utilities
 * Handles access and refresh token generation/verification
 */

const jwt = require('jsonwebtoken');

/**
 * Generate Access Token (short-lived)
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
    issuer: 'academic-management-system',
    audience: 'ams-client'
  });
};

/**
 * Generate Refresh Token (long-lived)
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    issuer: 'academic-management-system',
    audience: 'ams-client'
  });
};

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: 'academic-management-system',
    audience: 'ams-client'
  });
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'academic-management-system',
    audience: 'ams-client'
  });
};

/**
 * Generate token pair and return response
 */
const generateTokenPair = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
    email: user.email
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

  return { accessToken, refreshToken };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair
};
