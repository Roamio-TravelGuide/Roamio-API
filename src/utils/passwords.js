import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

const comparePasswords = async (plainText, hash) => {
  try {
    return await bcrypt.compare(plainText, hash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

export { hashPassword, comparePasswords };