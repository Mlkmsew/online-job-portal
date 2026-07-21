// ============================================
// JWT Utility - Generate & Send Tokens
// ============================================
const jwt = require('jsonwebtoken');

/**
 * Generate access token
 */
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

/**
 * Send token response with cookie
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
  };

  // Remove password from output
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.resetPasswordToken;
  delete userObj.emailVerificationToken;
  // Persist hashed refresh token for remember-me sessions when user is a mongoose doc
  try {
    if (user && typeof user.addRefreshToken === 'function') {
      user.addRefreshToken(refreshToken);
      // best-effort save
      user.save({ validateBeforeSave: false }).catch(() => {});
    }
  } catch (err) {
    // ignore
  }

  res
    .status(statusCode)
    .cookie('token', accessToken, cookieOptions)
    .json({
      success: true,
      message,
      accessToken,
      refreshToken,
      user: userObj,
    });
};

module.exports = { generateAccessToken, generateRefreshToken, sendTokenResponse };
