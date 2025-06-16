/**
 * Consumable Service
 * High-level service for consumable inventory management operations
 */

import apiClient from './api-client';
import type { Consumable } from '@/lib/types';

export class ConsumableService {
  /**
   * Get all consumables with optional filtering
   */
  async getAll(params?: {
    limit?: number;
    offset?: number;
    location?: string;
    type?: string;
    material?: string;
    low_inventory?: boolean;
    search?: string;
  }): Promise<Consumable[]> {
    const response = await apiClient.getConsumables(params);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch consumables');
    }
    return response.data as Consumable[];
  }

  /**
   * Get a specific consumable by ID
   */
  async getById(id: string): Promise<Consumable | null> {
    try {
      const response = await apiClient.getConsumableById(id);
      if (!response.success || !response.data) {
        return null;
      }
      return response.data as Consumable;
    } catch (error) {
      console.error('Error fetching consumable:', error);
      return null;
    }
  }

  /**
   * Create a new consumable
   */
  async create(data: Omit<Consumable, 'id' | 'createdAt' | 'updatedAt'>): Promise<Consumable> {
    const response = await apiClient.createConsumable(data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create consumable');
    }
    return response.data as Consumable;
  }

  /**
   * Update an existing consumable
   */
  async update(id: string, data: Partial<Consumable>): Promise<Consumable> {
    const response = await apiClient.updateConsumable(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update consumable');
    }
    return response.data as Consumable;
  }

  /**
   * Delete a consumable
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.deleteConsumable(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete consumable');
    }
  }

  /**
   * Get tools by location
   */
  async getByLocation(location: string, limit?: number): Promise<Consumable[]> {
    return this.getAll({ location, limit });
  }

  /**
   * Get tools by type
   */
  async getByType(type: string, limit?: number): Promise<Consumable[]> {
    return this.getAll({ type, limit });
  }

  /**
   * Get low inventory tools
   */
  async getLowInventory(): Promise<Consumable[]> {
    return this.getAll({ low_inventory: true });
  }

  /**
   * Search consumables
   */
  async search(query: string, limit?: number): Promise<Consumable[]> {
    return this.getAll({ search: query, limit });
  }

  /**
   * Get consumable statistics
   */
  async getInventoryStats(): Promise<{
    totalTools: number;
    totalQuantity: number;
    lowInventoryCount: number;
    toolsByLocation: { [location: string]: number };
    toolsByType: { [type: string]: number };
    recentlyAdded: Consumable[];
  }> {
    const [allTools, lowInventoryTools] = await Promise.all([
      this.getAll(),
      this.getLowInventory()
    ]);

    const totalQuantity = allTools.reduce((sum, tool) => sum + tool.quantity, 0);
    
    const toolsByLocation = allTools.reduce((acc, tool) => {
      acc[tool.location] = (acc[tool.location] || 0) + 1;
      return acc;
    }, {} as { [location: string]: number });

    const toolsByType = allTools.reduce((acc, tool) => {
      acc[tool.type] = (acc[tool.type] || 0) + 1;
      return acc;
    }, {} as { [type: string]: number });

    // Get recently used tools (by lastUsedDate if available)
    const recentlyAdded = allTools
      .filter(tool => tool.lastUsedDate)
      .sort((a, b) => new Date(b.lastUsedDate || '').getTime() - new Date(a.lastUsedDate || '').getTime())
      .slice(0, 5);

    return {
      totalTools: allTools.length,
      totalQuantity,
      lowInventoryCount: lowInventoryTools.length,
      toolsByLocation,
      toolsByType,
      recentlyAdded
    };
  }

  /**
   * Update tool quantity (for inventory management)
   */
  async updateQuantity(id: string, quantity: number): Promise<Consumable> {
    return this.update(id, { quantity });
  }

  /**
   * Add to inventory
   */
  async addToInventory(id: string, addQuantity: number): Promise<Consumable> {
    const tool = await this.getById(id);
    if (!tool) {
      throw new Error('Tool not found');
    }
    const newQuantity = tool.quantity + addQuantity;
    return this.update(id, { quantity: newQuantity });
  }

  /**
   * Remove from inventory
   */
  async removeFromInventory(id: string, removeQuantity: number): Promise<Consumable> {
    const tool = await this.getById(id);
    if (!tool) {
      throw new Error('Tool not found');
    }
    const newQuantity = Math.max(0, tool.quantity - removeQuantity);
    return this.update(id, { quantity: newQuantity });
  }
}

// Export singleton instance
export const consumableService = new ConsumableService();
