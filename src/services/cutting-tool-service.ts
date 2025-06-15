/**
 * Cutting Tool Service
 * High-level service for cutting tool inventory management operations
 */

import apiClient from './api-client';
import type { CuttingTool } from '@/lib/types';

export class CuttingToolService {
  /**
   * Get all cutting tools with optional filtering
   */
  async getAll(params?: {
    limit?: number;
    offset?: number;
    location?: string;
    type?: string;
    material?: string;
    low_inventory?: boolean;
    search?: string;
  }): Promise<CuttingTool[]> {
    const response = await apiClient.getCuttingTools(params);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch cutting tools');
    }
    return response.data as CuttingTool[];
  }

  /**
   * Get a specific cutting tool by ID
   */
  async getById(id: string): Promise<CuttingTool | null> {
    try {
      const response = await apiClient.getCuttingToolById(id);
      if (!response.success || !response.data) {
        return null;
      }
      return response.data as CuttingTool;
    } catch (error) {
      console.error('Error fetching cutting tool:', error);
      return null;
    }
  }

  /**
   * Create a new cutting tool
   */
  async create(data: Omit<CuttingTool, 'id' | 'createdAt' | 'updatedAt'>): Promise<CuttingTool> {
    const response = await apiClient.createCuttingTool(data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create cutting tool');
    }
    return response.data as CuttingTool;
  }

  /**
   * Update an existing cutting tool
   */
  async update(id: string, data: Partial<CuttingTool>): Promise<CuttingTool> {
    const response = await apiClient.updateCuttingTool(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update cutting tool');
    }
    return response.data as CuttingTool;
  }

  /**
   * Delete a cutting tool
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.deleteCuttingTool(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete cutting tool');
    }
  }

  /**
   * Get tools by location
   */
  async getByLocation(location: string, limit?: number): Promise<CuttingTool[]> {
    return this.getAll({ location, limit });
  }

  /**
   * Get tools by type
   */
  async getByType(type: string, limit?: number): Promise<CuttingTool[]> {
    return this.getAll({ type, limit });
  }

  /**
   * Get low inventory tools
   */
  async getLowInventory(): Promise<CuttingTool[]> {
    return this.getAll({ low_inventory: true });
  }

  /**
   * Search cutting tools
   */
  async search(query: string, limit?: number): Promise<CuttingTool[]> {
    return this.getAll({ search: query, limit });
  }

  /**
   * Get cutting tool statistics
   */
  async getInventoryStats(): Promise<{
    totalTools: number;
    totalQuantity: number;
    lowInventoryCount: number;
    toolsByLocation: { [location: string]: number };
    toolsByType: { [type: string]: number };
    recentlyAdded: CuttingTool[];
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
  async updateQuantity(id: string, quantity: number): Promise<CuttingTool> {
    return this.update(id, { quantity });
  }

  /**
   * Add to inventory
   */
  async addToInventory(id: string, addQuantity: number): Promise<CuttingTool> {
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
  async removeFromInventory(id: string, removeQuantity: number): Promise<CuttingTool> {
    const tool = await this.getById(id);
    if (!tool) {
      throw new Error('Tool not found');
    }
    const newQuantity = Math.max(0, tool.quantity - removeQuantity);
    return this.update(id, { quantity: newQuantity });
  }
}

// Export singleton instance
export const cuttingToolService = new CuttingToolService();
