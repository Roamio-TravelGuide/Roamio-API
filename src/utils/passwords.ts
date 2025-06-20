import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

export const comparePasswords = async (
  plainText: string, 
  hash: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainText, hash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};