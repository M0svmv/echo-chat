/**
 * Application Messages Constants
 */
const MESSAGES = {
  // Auth Messages
  REGISTRATION_SUCCESS: "User registered successfully. Please verify your email.",
  LOGIN_SUCCESS: "Login successful.",
  LOGOUT_SUCCESS: "Logout successful.",
  EMAIL_VERIFICATION_SENT: "Verification email sent successfully.",
  EMAIL_VERIFIED_SUCCESS: "Email verified successfully.",
  EMAIL_ALREADY_VERIFIED: "Email is already verified.",
  RESET_PASSWORD_EMAIL_SENT: "Password reset email sent successfully.",
  PASSWORD_RESET_SUCCESS: "Password reset successfully.",
  PASSWORD_CHANGED_SUCCESS: "Password changed successfully.",
  REFRESH_TOKEN_SUCCESS: "Token refreshed successfully.",

  // Error Messages
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_ALREADY_EXISTS: "Email already registered.",
  USER_NOT_FOUND: "User not found.",
  EMAIL_NOT_VERIFIED: "Please verify your email before logging in.",
  INVALID_TOKEN: "Invalid or expired token.",
  TOKEN_EXPIRED: "Token has expired.",
  INVALID_RESET_TOKEN: "Invalid or expired reset token.",
  INVALID_VERIFICATION_TOKEN: "Invalid or expired verification token.",
  UNAUTHORIZED_ACCESS: "Unauthorized access.",
  FORBIDDEN_ACCESS: "You do not have permission to access this resource.",
  INTERNAL_ERROR: "Internal server error. Please try again later.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later.",
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",

  // Validation Messages
  INVALID_EMAIL: "Invalid email format.",
  PASSWORD_TOO_WEAK: "Password must be at least 8 characters with uppercase, lowercase, and numbers.",
  PASSWORD_MISMATCH: "Passwords do not match.",
  NAME_REQUIRED: "Name is required.",
  EMAIL_REQUIRED: "Email is required.",
  PASSWORD_REQUIRED: "Password is required.",
};

module.exports = MESSAGES;
