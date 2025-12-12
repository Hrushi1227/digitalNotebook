/**
 * Input validation helpers to prevent XSS and ensure data integrity
 */

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input
    .trim()
    .slice(0, 500) // Limit length
    .replace(/[<>]/g, ""); // Remove dangerous chars
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[0-9\s\-\+\(\)]{7,20}$/;
  return re.test(phone?.toString() || "");
};

export const validateAmount = (amount) => {
  const num = Number(amount);
  return !isNaN(num) && num >= 0 && num <= 9999999;
};

export const validatePasscode = (passcode) => {
  // Passcode must be 4-6 digits
  return /^\d{4,6}$/.test(passcode);
};

export const validateDate = (dateString) => {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

export default {
  sanitizeInput,
  validateEmail,
  validatePhone,
  validateAmount,
  validatePasscode,
  validateDate,
};
