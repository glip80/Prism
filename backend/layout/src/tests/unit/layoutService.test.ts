import { LayoutService } from '../../services/layoutService';

// Mock dependencies
jest.mock('../../models/layout');
jest.mock('../../services/versioningService');

describe('LayoutService', () => {
  let layoutService: LayoutService;

  beforeEach(() => {
    layoutService = new LayoutService();
    jest.clearAllMocks();
  });

  describe('createLayout', () => {
    it('should create a new layout with a UUID and version 1', async () => {
      const mockSave = jest.fn().mockResolvedValue({
        id: 'test-uuid',
        title: 'Test Dashboard',
        version: 1,
        widgets: [],
        toJSON: () => ({ id: 'test-uuid', title: 'Test Dashboard', version: 1, widgets: [] }),
      });

      const LayoutModel = require('../../models/layout').LayoutModel;
      LayoutModel.mockImplementation(() => ({ save: mockSave }));

      const { versioningService } = require('../../services/versioningService');
      versioningService.saveSnapshot = jest.fn().mockResolvedValue({});

      const result = await layoutService.createLayout({ title: 'Test Dashboard' });

      expect(result).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('getLayouts', () => {
    it('should return a list of layouts sorted by created_at', async () => {
      const mockLayouts = [
        { id: '1', title: 'Layout A', version: 1 },
        { id: '2', title: 'Layout B', version: 2 },
      ];

      const LayoutModel = require('../../models/layout').LayoutModel;
      LayoutModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockLayouts),
      });

      const result = await layoutService.getLayouts();
      expect(result).toEqual(mockLayouts);
      expect(LayoutModel.find).toHaveBeenCalled();
    });
  });

  describe('deleteLayout', () => {
    it('should delete a layout and return true', async () => {
      const LayoutModel = require('../../models/layout').LayoutModel;
      LayoutModel.findOneAndDelete = jest.fn().mockResolvedValue({ id: '1' });

      const result = await layoutService.deleteLayout('1');
      expect(result).toBe(true);
    });

    it('should return false if layout not found', async () => {
      const LayoutModel = require('../../models/layout').LayoutModel;
      LayoutModel.findOneAndDelete = jest.fn().mockResolvedValue(null);

      const result = await layoutService.deleteLayout('nonexistent');
      expect(result).toBe(false);
    });
  });
});
