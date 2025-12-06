
// Data Models designed for scalability and future AI injection

export enum BlockType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DRAWING = 'DRAWING',
  // Future types: AI_EXPLANATION, QUIZ, DIAGRAM_GENERATOR
}

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface TextBlockData extends BaseBlock {
  type: BlockType.TEXT;
  content: string; // HTML or Markdown
  fontFamily?: 'sans' | 'hand' | 'comic';
  fontSize?: 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface ImageBlockData extends BaseBlock {
  type: BlockType.IMAGE;
  url: string;
  caption?: string;
  width?: number; // Percentage: 25, 50, 75, 100
  align?: 'left' | 'center' | 'right';
}

export interface DrawingBlockData extends BaseBlock {
  type: BlockType.DRAWING;
  dataUrl: string; // Base64 representation of the canvas
}

export type Block = TextBlockData | ImageBlockData | DrawingBlockData;

export interface Page {
  id: string;
  notebookId: string;
  pageNumber: number;
  blocks: Block[];
  createdAt: number;
}

export interface Notebook {
  id: string;
  title: string;
  subject: string;
  coverColor: string;
  description?: string;
  pageOrder: string[]; // Array of Page IDs
  createdAt: number;
}

export type Theme = 'light' | 'dark' | 'system';

export interface AppState {
  notebooks: Notebook[];
  pages: Record<string, Page>; // Normalized page store
  theme: Theme;
}

// Colors for notebook covers
export const NOTEBOOK_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
  'bg-slate-600',
];
