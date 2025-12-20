'use server';

import { createUser, getUserByEmail } from '@/lib/models/user';
import bcrypt from 'bcryptjs';

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { error: 'User already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Registration failed' };
  }
}

