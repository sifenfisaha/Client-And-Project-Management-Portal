import { randomUUID } from 'crypto';

export const generateId = (prefix) => {
  const base = randomUUID();
  return prefix ? `${prefix}_${base}` : base;
};
