import bcrypt from "bcryptjs";

const PASSWORD_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_ROUNDS);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
