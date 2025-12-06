import { AppState, Notebook, Page, Block, BlockType } from '../types';

const STORAGE_KEY = 'student-notebook-pro-v1';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createInitialState = (): AppState => {
  const demoNotebookId = generateId();
  const demoPageId1 = generateId();
  const demoPageId2 = generateId();

  const demoNotebook: Notebook = {
    id: demoNotebookId,
    title: 'Science Notes',
    subject: 'Biology',
    coverColor: 'bg-emerald-500',
    description: 'Class notes for Semester 1',
    pageOrder: [demoPageId1, demoPageId2],
    createdAt: Date.now(),
  };

  const demoPage1: Page = {
    id: demoPageId1,
    notebookId: demoNotebookId,
    pageNumber: 1,
    createdAt: Date.now(),
    blocks: [
      {
        id: generateId(),
        type: BlockType.TEXT,
        content: '<h1>Chapter 1: The Cell</h1><p>The cell is the basic structural, functional, and biological unit of all known organisms. A cell is the smallest unit of life.</p>',
      },
      {
        id: generateId(),
        type: BlockType.DRAWING,
        dataUrl: '', // Empty initially
      }
    ],
  };

  const demoPage2: Page = {
    id: demoPageId2,
    notebookId: demoNotebookId,
    pageNumber: 2,
    createdAt: Date.now(),
    blocks: [
       {
        id: generateId(),
        type: BlockType.TEXT,
        content: '<p>Remember to study the mitochondria! It is the powerhouse of the cell.</p>',
      },
    ],
  };

  return {
    notebooks: [demoNotebook],
    pages: {
      [demoPageId1]: demoPage1,
      [demoPageId2]: demoPage2,
    },
    theme: 'system',
  };
};

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return createInitialState();
    const state = JSON.parse(serialized);
    
    // Migration for existing users who don't have theme property
    if (!state.theme) {
        state.theme = 'system';
    }
    
    return state;
  } catch (e) {
    console.error("Failed to load state", e);
    return createInitialState();
  }
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const createNewNotebook = (title: string, subject: string, color: string): Notebook => {
  return {
    id: generateId(),
    title,
    subject,
    coverColor: color,
    pageOrder: [],
    createdAt: Date.now(),
  };
};

export const createNewPage = (notebookId: string, pageNumber: number): Page => {
  return {
    id: generateId(),
    notebookId,
    pageNumber,
    createdAt: Date.now(),
    blocks: [
      { id: generateId(), type: BlockType.TEXT, content: '' }
    ],
  };
};