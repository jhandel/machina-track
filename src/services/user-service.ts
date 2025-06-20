/**
 * User Service
 * High-level service for user management operations
 */

import apiClient from './api-client';

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  password: string;
}

export class UserService {
  // Users
  static async getUsers(): Promise<User[]> {
    const response = await apiClient.getUsers();
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch users');
    }
    return response.data as User[];
  }

  static async getUserById(id: string): Promise<User> {
    const response = await apiClient.getUserById(id);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch user');
    }
    return response.data as User;
  }

  static async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.createUser(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create user');
    }
    return response.data as User;
  }

  static async resetUserPassword(id: string, data: ResetPasswordRequest): Promise<User> {
    const response = await apiClient.resetUserPassword(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to reset user password');
    }
    return response.data as User;
  }

  static async deleteUser(id: string): Promise<void> {
    const response = await apiClient.deleteUser(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete user');
    }
  }
}
