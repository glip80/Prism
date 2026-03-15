import { LayoutModel, ILayout } from '../models/layout';
import { versioningService } from './versioningService';
import { v4 as uuidv4 } from 'uuid';

export class LayoutService {
  async createLayout(data: Partial<ILayout>) {
    const layoutId = uuidv4();
    const layout = new LayoutModel({
      ...data,
      id: layoutId,
      version: 1,
    });
    const saved = await layout.save();
    
    // Save initial snapshot
    await versioningService.saveSnapshot(layoutId, 1, saved.toJSON(), saved.created_by);
    return saved;
  }

  async getLayouts() {
    return LayoutModel.find().sort({ created_at: -1 });
  }

  async getLayout(id: string, version?: number) {
    if (version) {
      const snapshot = await versioningService.getSnapshot(id, version);
      if (snapshot) return snapshot.data;
    }
    return LayoutModel.findOne({ id });
  }

  async updateLayout(id: string, data: Partial<ILayout>) {
    const layout = await LayoutModel.findOne({ id });
    if (!layout) throw new Error('Layout not found');

    // Update document
    Object.assign(layout, data);
    layout.updated_at = new Date();
    
    // Auto-increment version handling is complex; standard is draft vs published.
    // For simplicity, every save bumps version.
    layout.version += 1;
    
    const saved = await layout.save();
    return saved;
  }

  async deleteLayout(id: string) {
    const layout = await LayoutModel.findOneAndDelete({ id });
    return !!layout;
  }

  async publishSnapshot(id: string, userId?: string) {
     const layout = await LayoutModel.findOne({ id });
     if (!layout) throw new Error('Layout not found');

     const layoutData = layout.toJSON();
     const nextVersion = layout.version;
     await versioningService.saveSnapshot(id, nextVersion, layoutData, userId);
     return layout;
  }
}

export const layoutService = new LayoutService();
