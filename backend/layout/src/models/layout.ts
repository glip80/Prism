import mongoose, { Schema, Document } from 'mongoose';

export interface ILayout extends Document {
  id: string; // Used for external references
  title: string;
  description?: string;
  version: number;
  widgets: any[];
  layout_config: {
    rowHeight?: number;
    margin?: [number, number];
    containerPadding?: [number, number];
  };
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

const LayoutSchema = new Schema<ILayout>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  version: { type: Number, default: 1 },
  widgets: [{ type: Schema.Types.Mixed }],
  layout_config: { type: Schema.Types.Mixed, default: {} },
  created_by: { type: String },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const LayoutModel = mongoose.model<ILayout>('Layout', LayoutSchema);
