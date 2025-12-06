
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
  const [isProcessing, setIsProcessing] = useState(false);
  
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
      const url = "https://picsum.photos/600/400"; 
      newBlock = { id: newBlockId, type: BlockType.IMAGE, url, caption: '' };
    }

    onUpdatePage({ ...page, blocks: [...page.blocks, newBlock] });
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
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
      setIsProcessing(false);
    };
    reader.onerror = () => {
        setIsProcessing(false);
        alert("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
    }
    
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
      {/* Paper Surface - Optimized for mobile width */}
      <div 
        className={`flex-1 bg-paper shadow-md dark:shadow-black/50 rounded-sm min-h-[600px] p-5 md:p-12 relative overflow-y-auto mb-24 md:mb-0 border transition-all duration-300
            ${isDragging 
                ? 'border-blue-500 ring-4 ring-blue-500/20 dark:ring-blue-400/20 scale-[1.01]' 
                : 'border-gray-200 dark:border-gray-700'
            }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        <div className={`absolute inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center rounded-sm transition-opacity duration-300 pointer-events-none ${isDragging || isProcessing ? 'opacity-100' : 'opacity-0'}`}>
             {isDragging && !isProcessing && (
                <div className="text-center animate-bounce">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-6 rounded-full inline-block mb-4 border-4 border-blue-200 dark:border-blue-800">
                        <Icons.Upload size={48} className="text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Drop image to insert</h3>
                </div>
             )}
             
             {isProcessing && (
                 <div className="text-center">
                    <Icons.Loader size={48} className="text-blue-500 dark:text-blue-400 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 dark:text-gray-200">Processing image...</h3>
                 </div>
             )}
        </div>

        {/* Binder Holes (Visual) */}
        <div className="absolute left-2 md:left-4 top-0 bottom-0 flex flex-col justify-evenly h-full pointer-events-none opacity-50">
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gray-200 shadow-inner"></div>
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gray-200 shadow-inner"></div>
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gray-200 shadow-inner"></div>
        </div>

        {/* Red Margin Line */}
        <div className="absolute left-10 md:left-16 top-0 bottom-0 w-px bg-paper-red opacity-50 pointer-events-none h-full z-0"></div>

        {/* Content Area */}
        <div className="pl-8 md:pl-12 relative z-10">
          <div className="flex justify-between items-end border-b-2 border-paper-line pb-2 mb-6">
             <div className="text-gray-400 font-hand text-base md:text-lg">Date: {new Date(page.createdAt).toLocaleDateString()}</div>
             <div className="text-gray-400 font-hand text-base md:text-lg">Page No. {page.pageNumber}</div>
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
            
            {page.blocks.length === 0 && !isDragging && !isProcessing && (
                <div className="text-center py-20 text-gray-400 font-hand text-xl md:text-2xl opacity-60 flex flex-col items-center gap-2">
                    <span>{readOnly ? 'Empty page.' : 'Start writing or drop an image here!'}</span>
                    {!readOnly && <Icons.Upload size={24} className="opacity-50 animate-pulse" />}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Toolbar - Responsive adjustments */}
      {!readOnly && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-1.5 md:p-2 flex gap-1 md:gap-2 items-center z-50 max-w-[90vw] overflow-x-auto">
            <button 
                onClick={() => addBlock(BlockType.TEXT)}
                className="p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 transition-colors flex flex-col items-center gap-1 min-w-[50px] md:min-w-[60px]"
            >
                <Icons.Text size={18} className="md:w-5 md:h-5" />
                <span className="text-[9px] md:text-[10px] font-semibold">Text</span>
            </button>
            <div className="w-px h-6 md:h-8 bg-gray-200 dark:bg-gray-700"></div>
            <button 
                onClick={() => addBlock(BlockType.DRAWING)}
                className="p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 transition-colors flex flex-col items-center gap-1 min-w-[50px] md:min-w-[60px]"
            >
                <Icons.Pen size={18} className="md:w-5 md:h-5" />
                <span className="text-[9px] md:text-[10px] font-semibold">Draw</span>
            </button>
            <div className="w-px h-6 md:h-8 bg-gray-200 dark:bg-gray-700"></div>
            <label className="p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 transition-colors flex flex-col items-center gap-1 min-w-[50px] md:min-w-[60px] cursor-pointer">
                <Icons.Image size={18} className="md:w-5 md:h-5" />
                <span className="text-[9px] md:text-[10px] font-semibold">Img</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
        </div>
      )}
    </div>
  );
};
