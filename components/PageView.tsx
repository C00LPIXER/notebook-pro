
import React, { useState } from 'react';
import { Page, Block, BlockType } from '../types';
import { BlockRenderer } from './BlockRenderer';
import { Icons } from './Icon';

interface PageViewProps {
  page: Page;
  onUpdatePage: (updatedPage: Page) => void;
  readOnly?: boolean;
}

export const PageView: React.FC<PageViewProps> = ({ page, onUpdatePage, readOnly = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleBlockChange = (updatedBlock: Block) => {
    if (readOnly) return;
    const newBlocks = page.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    onUpdatePage({ ...page, blocks: newBlocks });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (readOnly) return;
    const newBlocks = page.blocks.filter(b => b.id !== blockId);
    onUpdatePage({ ...page, blocks: newBlocks });
  };

  const addBlock = (type: BlockType) => {
    if (readOnly) return;
    const newBlockId = Math.random().toString(36).substr(2, 9);
    let newBlock: Block;

    if (type === BlockType.TEXT) {
      newBlock = { id: newBlockId, type: BlockType.TEXT, content: '' };
    } else if (type === BlockType.DRAWING) {
      newBlock = { id: newBlockId, type: BlockType.DRAWING, dataUrl: '' };
    } else {
      // Mock image add - in real app, open file picker
      const url = "https://picsum.photos/600/400"; 
      newBlock = { id: newBlockId, type: BlockType.IMAGE, url, caption: '' };
    }

    onUpdatePage({ ...page, blocks: [...page.blocks, newBlock] });
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
          const newBlockId = Math.random().toString(36).substr(2, 9);
          const newBlock: Block = {
              id: newBlockId,
              type: BlockType.IMAGE,
              url: ev.target.result as string,
              caption: ''
          };
          onUpdatePage({ ...page, blocks: [...page.blocks, newBlock] });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle actual image upload via input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processFile(file);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Paper Surface - Always kept light to preserve drawing/text contrast like a real physical page */}
      <div 
        className={`flex-1 bg-paper shadow-md dark:shadow-black/50 rounded-sm min-h-[600px] p-8 md:p-12 relative overflow-y-auto mb-24 md:mb-0 border border-gray-200 dark:border-gray-700 transition-all duration-200 ${isDragging ? 'ring-4 ring-blue-400/50 scale-[1.01]' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragging && (
            <div className="absolute inset-4 z-50 border-4 border-dashed border-blue-400 bg-blue-50/50 flex items-center justify-center rounded-lg pointer-events-none">
                <div className="text-blue-500 font-bold text-2xl bg-white/80 px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
                    <Icons.Image size={32} />
                    Drop image to upload
                </div>
            </div>
        )}

        {/* Binder Holes (Visual) */}
        <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-evenly h-full pointer-events-none opacity-50">
            <div className="w-4 h-4 rounded-full bg-gray-200 shadow-inner"></div>
            <div className="w-4 h-4 rounded-full bg-gray-200 shadow-inner"></div>
            <div className="w-4 h-4 rounded-full bg-gray-200 shadow-inner"></div>
        </div>

        {/* Red Margin Line */}
        <div className="absolute left-16 top-0 bottom-0 w-px bg-paper-red opacity-50 pointer-events-none h-full z-0"></div>

        {/* Content Area */}
        <div className="pl-12 relative z-10">
          <div className="flex justify-between items-end border-b-2 border-paper-line pb-2 mb-6">
             <div className="text-gray-400 font-hand text-lg">Date: {new Date(page.createdAt).toLocaleDateString()}</div>
             <div className="text-gray-400 font-hand text-lg">Page No. {page.pageNumber}</div>
          </div>

          <div className="space-y-4 min-h-[400px]">
            {page.blocks.map(block => (
              <BlockRenderer 
                key={block.id} 
                block={block} 
                onChange={handleBlockChange}
                onDelete={() => handleDeleteBlock(block.id)}
                readOnly={readOnly}
              />
            ))}
            
            {page.blocks.length === 0 && !isDragging && (
                <div className="text-center py-20 text-gray-400 font-hand text-2xl opacity-60">
                    {readOnly ? 'Empty page.' : 'Empty page. Start writing, drawing, or drop an image here!'}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Toolbar for Mobile / Fixed Toolbar for Desktop - Hidden in Read Mode */}
      {!readOnly && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-2 items-center z-50">
            <button 
                onClick={() => addBlock(BlockType.TEXT)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 transition-colors flex flex-col items-center gap-1 min-w-[60px]"
            >
                <Icons.Text size={20} />
                <span className="text-[10px] font-semibold">Text</span>
            </button>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
            <button 
                onClick={() => addBlock(BlockType.DRAWING)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 transition-colors flex flex-col items-center gap-1 min-w-[60px]"
            >
                <Icons.Pen size={20} />
                <span className="text-[10px] font-semibold">Draw</span>
            </button>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
            <label className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 transition-colors flex flex-col items-center gap-1 min-w-[60px] cursor-pointer">
                <Icons.Image size={20} />
                <span className="text-[10px] font-semibold">Img</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
        </div>
      )}
    </div>
  );
};
