import { describe, it, expect, vi, beforeEach } from 'vitest';
import { maintenanceService } from '../src/services/maintenance-service';
import { serviceRecordService } from '../src/services/service-record-service';
import apiClient from '../src/services/api-client';

// Mock dependencies
vi.mock('../src/services/api-client', () => {
  return {
    default: {
      getMaintenanceTaskById: vi.fn(),
      updateMaintenanceTask: vi.fn(),
      createServiceRecord: vi.fn(),
    }
  };
});

vi.mock('../src/services/service-record-service', () => {
  return {
    serviceRecordService: {
      create: vi.fn(),
    }
  };
});

describe('MaintenanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('completeMaintenanceTask', () => {
    it('should create a service record and update a one-time maintenance task', async () => {
      // Mock data
      const mockTask = {
        id: 'task-123',
        equipmentId: 'equip-456',
        description: 'One-time maintenance',
        status: 'pending',
        serviceRecordIds: ['sr-789'],
        // No frequencyDays for one-time task
      };

      const mockServiceRecord = {
        id: 'sr-new',
        maintenanceTaskId: 'task-123',
        date: '2025-06-18',
        performedBy: 'John Doe',
        descriptionOfWork: 'Completed maintenance',
      };

      const mockUpdatedTask = {
        ...mockTask,
        status: 'completed',
        lastPerformedDate: '2025-06-18',
        nextDueDate: undefined,
        serviceRecordIds: ['sr-789', 'sr-new'],
      };

      // Setup mocks
      apiClient.getMaintenanceTaskById.mockResolvedValue({ 
        success: true, 
        data: mockTask 
      });
      
      serviceRecordService.create.mockResolvedValue(mockServiceRecord);
      
      apiClient.updateMaintenanceTask.mockResolvedValue({ 
        success: true, 
        data: mockUpdatedTask 
      });

      // Execute
      const result = await maintenanceService.completeMaintenanceTask('task-123', {
        performedBy: 'John Doe',
        descriptionOfWork: 'Completed maintenance',
      });

      // Verify
      expect(serviceRecordService.create).toHaveBeenCalledWith({
        maintenanceTaskId: 'task-123',
        date: expect.any(String),
        performedBy: 'John Doe',
        descriptionOfWork: 'Completed maintenance',
      });

      expect(apiClient.updateMaintenanceTask).toHaveBeenCalledWith('task-123', {
        lastPerformedDate: expect.any(String),
        nextDueDate: undefined,
        status: 'completed',
        serviceRecordIds: ['sr-789', 'sr-new'],
      });

      expect(result).toEqual({
        task: mockUpdatedTask,
        serviceRecord: mockServiceRecord,
      });
    });

    it('should create a service record and reschedule a recurring maintenance task', async () => {
      // Mock data for a recurring task
      const mockTask = {
        id: 'task-123',
        equipmentId: 'equip-456',
        description: 'Recurring maintenance',
        status: 'pending',
        frequencyDays: 30, // 30-day recurring task
        serviceRecordIds: ['sr-789'],
      };

      const mockServiceRecord = {
        id: 'sr-new',
        maintenanceTaskId: 'task-123',
        date: '2025-06-18',
        performedBy: 'John Doe',
        descriptionOfWork: 'Completed maintenance',
      };

      // Calculate expected next due date (today + 30 days)
      const today = new Date('2025-06-18');
      const nextDueDate = new Date(today);
      nextDueDate.setDate(today.getDate() + 30);
      const expectedNextDueDate = nextDueDate.toISOString().split('T')[0];

      const mockUpdatedTask = {
        ...mockTask,
        status: 'pending', // Reset to pending for recurring tasks
        lastPerformedDate: '2025-06-18',
        nextDueDate: expectedNextDueDate,
        serviceRecordIds: ['sr-789', 'sr-new'],
      };

      // Setup mocks
      apiClient.getMaintenanceTaskById.mockResolvedValue({ 
        success: true, 
        data: mockTask 
      });
      
      serviceRecordService.create.mockResolvedValue(mockServiceRecord);
      
      apiClient.updateMaintenanceTask.mockResolvedValue({ 
        success: true, 
        data: mockUpdatedTask 
      });

      // Mock the date to ensure consistent test results
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super('2025-06-18T12:00:00Z');
        }
        static now() { 
          return new Date('2025-06-18T12:00:00Z').getTime();
        }
      };

      // Execute
      const result = await maintenanceService.completeMaintenanceTask('task-123', {
        performedBy: 'John Doe',
        descriptionOfWork: 'Completed recurring maintenance',
      });

      // Restore original Date
      global.Date = originalDate;

      // Verify
      expect(serviceRecordService.create).toHaveBeenCalledWith({
        maintenanceTaskId: 'task-123',
        date: '2025-06-18',
        performedBy: 'John Doe',
        descriptionOfWork: 'Completed recurring maintenance',
      });

      expect(apiClient.updateMaintenanceTask).toHaveBeenCalledWith('task-123', {
        lastPerformedDate: '2025-06-18',
        nextDueDate: expectedNextDueDate,
        status: 'pending',
        serviceRecordIds: ['sr-789', 'sr-new'],
      });

      expect(result).toEqual({
        task: mockUpdatedTask,
        serviceRecord: mockServiceRecord,
      });
    });
  });
});
