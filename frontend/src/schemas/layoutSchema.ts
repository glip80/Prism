import { z } from 'zod';

export const LayoutSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  organization_id: z.string().uuid(),
  created_by: z.string().uuid(),
  
  // Grid configuration
  layout_config: z.object({
    breakpoints: z.record(z.number()),
    cols: z.record(z.number()),
    rowHeight: z.number().positive(),
    margin: z.tuple([z.number(), z.number()]),
    containerPadding: z.tuple([z.number(), z.number()]).optional(),
    compactType: z.enum(['vertical', 'horizontal']).nullable().optional()
  }),
  
  // Widgets array
  widgets: z.array(z.object({
    id: z.string(),
    type: z.enum(['chart', 'table', 'metric', 'text', 'iframe', 'custom']),
    title: z.string(),
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
    minW: z.number().int().optional(),
    minH: z.number().int().optional(),
    maxW: z.number().int().optional(),
    maxH: z.number().int().optional(),
    static: z.boolean().default(false),
    isDraggable: z.boolean().default(true),
    isResizable: z.boolean().default(true),
    
    // Widget configuration
    config: z.object({
      dataSource: z.object({
        connector_id: z.string().uuid(),
        query: z.string(),
        parameters: z.array(z.any()).default([]),
        refreshInterval: z.number().min(5000).optional(), // Minimum 5s
        cacheDuration: z.number().min(0).default(60000),
        timeout: z.number().min(1000).max(300000).default(30000)
      }),
      visualization: z.record(z.any()).optional(),
      interactions: z.record(z.any()).optional()
    }),
    
    themeOverrides: z.record(z.record(z.any())).optional()
  })),
  
  theme: z.object({
    id: z.string(),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
    backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i),
    textColor: z.string().regex(/^#[0-9A-F]{6}$/i)
  }),
  
  tags: z.array(z.string()).default([]),
  is_public: z.boolean().default(false),
  shared_with: z.array(z.string().uuid()).default([]),
  version: z.number().int().positive().default(1)
});

export type Layout = z.infer<typeof LayoutSchema>;
