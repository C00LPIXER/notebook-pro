
import React, { useEffect, useRef, useState } from 'react';
import { Block, BlockType, TextBlockData, DrawingBlockData, ImageBlockData } from '../types';
import DrawingCanvas from './DrawingCanvas';
import { Icons } from './Icon';

interface BlockProps {
  block: Block;
  onChange: (updatedBlock: Block) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

// Map styles to static classes so Tailwind detects them
const FONT_FAMILY_CLASSES: Record<string, string> = {
  sans: 'font-sans',
  hand: 'font-hand',
  comic: 'font-comic',
};

const FONT_SIZE_CLASSES: Record<string, string> = {
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

export const BlockRenderer: React.FC<BlockProps> = ({ block, onChange, onDelete, readOnly = false }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const renderContent = () => {
    switch (block.type) {
      case BlockType.TEXT:
        return <TextBlock block={block} onChange={onChange} readOnly={readOnly} />;
      case BlockType.IMAGE:
        return <ImageBlock block={block} onChange={onChange} readOnly={readOnly} />;
      case BlockType.DRAWING:
        return <DrawingBlock block={block} onChange={onChange} readOnly={readOnly} />;
      default:
        return <div>Unknown Block Type</div>;
    }
  };

  return (
    <div className={`group relative mb-4 transition-all rounded-lg p-2 -ml-2 -mr-2 border border-transparent 
        ${readOnly ? '' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/10 hover:border-gray-200 dark:hover:border-gray-700'}
    `}>
      {!readOnly && (
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity z-20">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-md border border-red-200 dark:border-red-900 animate-in fade-in zoom-in-95 duration-200">
               <span className="text-xs text-red-500 font-bold px-1 select-none">Sure?</span>
               <button 
                 onClick={(e) => { e.stopPropagation(); onDelete(); }}
                 className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded"
                 title="Confirm Delete"
               >
                  <Icons.Check size={14} />
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                 className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded"
                 title="Cancel"
               >
                  <Icons.Close size={14} />
               </button>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} 
              className="p-1.5 bg-white dark:bg-gray-700 text-red-500 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Delete Block"
            >
              <Icons.Trash size={16} />
            </button>
          )}
        </div>
      )}
      {renderContent()}
    </div>
  );
};

const TextBlock: React.FC<{block: TextBlockData, onChange: any, readOnly: boolean}> = ({ block, onChange, readOnly }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Orange', value: '#d97706' },
    { name: 'Purple', value: '#9333ea' },
  ];

  // Sync content when block.content changes externally (e.g., Undo/Redo)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== block.content) {
      if (document.activeElement !== editorRef.current) {
         editorRef.current.innerHTML = block.content;
      }
    }
  }, [block.content]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
        onChange({ ...block, content: newContent });
    }, 500); 
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    if (editorRef.current) {
        onChange({ ...block, content: editorRef.current.innerHTML });
    }
    setTimeout(() => {
        setIsFocused(false);
        setShowColorPicker(false);
    }, 200);
  };

  const updateStyle = (updates: Partial<TextBlockData>) => {
    onChange({ ...block, ...updates });
  };

  const currentFont = block.fontFamily || 'hand';
  const currentSize = block.fontSize || 'xl';
  const currentColor = block.textColor || '#000000';
  const currentAlign = block.textAlign || 'left';

  const fontSizes = ['base', 'lg', 'xl', '2xl', '3xl'];

  const increaseSize = () => {
    const idx = fontSizes.indexOf(currentSize);
    if (idx < fontSizes.length - 1) updateStyle({ fontSize: fontSizes[idx + 1] as any });
  };

  const decreaseSize = () => {
    const idx = fontSizes.indexOf(currentSize);
    if (idx > 0) updateStyle({ fontSize: fontSizes[idx - 1] as any });
  };

  return (
    <div className="relative w-full pr-0 sm:pr-8">
      {/* Formatting Toolbar */}
      {!readOnly && isFocused && (
        <div className="absolute -top-32 sm:-top-16 left-0 sm:left-auto flex flex-col sm:flex-row gap-1 sm:gap-2 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-1.5 rounded-lg z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 w-[95%] sm:w-auto max-w-[95vw]">
           
           {/* Top Row (Mobile): Font Family */}
           <div className="flex items-center gap-2 border-b sm:border-b-0 border-gray-100 dark:border-gray-700 pb-1 sm:pb-0 mb-1 sm:mb-0 justify-between sm:justify-start w-full sm:w-auto">
               <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5 w-full sm:w-auto">
                 <button onClick={() => updateStyle({ fontFamily: 'sans' })} className={`flex-1 sm:flex-none px-2 py-1 rounded text-xs font-sans ${currentFont === 'sans' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Inter</button>
                 <button onClick={() => updateStyle({ fontFamily: 'hand' })} className={`flex-1 sm:flex-none px-2 py-1 rounded text-xs font-hand ${currentFont === 'hand' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Hand</button>
                 <button onClick={() => updateStyle({ fontFamily: 'comic' })} className={`flex-1 sm:flex-none px-2 py-1 rounded text-xs font-comic ${currentFont === 'comic' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Comic</button>
               </div>
               
               <div className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
           </div>

           {/* Second Row (Mobile): Size, Color, Align */}
           <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
               
               {/* Font Size Selector */}
               <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded p-0.5">
                 <button onClick={decreaseSize} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300"><Icons.Minus size={14} /></button>
                 <span className="text-xs w-6 text-center text-gray-500 dark:text-gray-400 font-mono">
                    {currentSize === 'base' && '16'}
                    {currentSize === 'lg' && '18'}
                    {currentSize === 'xl' && '20'}
                    {currentSize === '2xl' && '24'}
                    {currentSize === '3xl' && '30'}
                 </span>
                 <button onClick={increaseSize} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300"><Icons.Plus size={14} /></button>
               </div>

               <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
               
               {/* Color Button */}
               <div className="relative">
                   <button 
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 border border-gray-200 dark:border-gray-600"
                   >
                       <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 shadow-sm" style={{ backgroundColor: currentColor }}></div>
                       <Icons.Left size={10} className="-rotate-90 text-gray-400" />
                   </button>
                   
                   {showColorPicker && (
                       <div className="absolute top-full right-0 sm:left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-1 z-50 w-[100px]">
                           {colors.map(c => (
                               <button 
                                key={c.name}
                                onClick={() => { updateStyle({ textColor: c.value }); setShowColorPicker(false); }}
                                className={`w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform ${currentColor === c.value ? 'ring-2 ring-blue-400' : ''}`}
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                               />
                           ))}
                       </div>
                   )}
               </div>

               <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

               {/* Alignments */}
               <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5">
                     <button onClick={() => updateStyle({ textAlign: 'left' })} className={`p-1 rounded ${currentAlign === 'left' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}><Icons.AlignLeft size={14} /></button>
                     <button onClick={() => updateStyle({ textAlign: 'center' })} className={`p-1 rounded ${currentAlign === 'center' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}><Icons.AlignCenter size={14} /></button>
                     <button onClick={() => updateStyle({ textAlign: 'right' })} className={`p-1 rounded ${currentAlign === 'right' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}><Icons.AlignRight size={14} /></button>
                     <button onClick={() => updateStyle({ textAlign: 'justify' })} className={`p-1 rounded ${currentAlign === 'justify' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}><Icons.AlignJustify size={14} /></button>
               </div>
           </div>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        className={`w-full min-h-[1.5em] outline-none
            ${FONT_FAMILY_CLASSES[currentFont]} 
            ${FONT_SIZE_CLASSES[currentSize]} 
            ${readOnly ? '' : 'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 cursor-text'}
        `}
        data-placeholder="Start typing notes here..."
        style={{
          lineHeight: '1.6',
          marginBottom: '0.5em',
          color: currentColor,
          textAlign: currentAlign
        }}
      />
    </div>
  );
};

const ImageBlock: React.FC<{block: ImageBlockData, onChange: any, readOnly: boolean}> = ({ block, onChange, readOnly }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [localWidth, setLocalWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const dragStartRef = useRef<{ startX: number, startWidth: number, parentWidth: number } | null>(null);
  const blockRef = useRef(block);
  
  blockRef.current = block;

  const width = isResizing && localWidth !== null ? localWidth : (block.width || 100);
  const align = block.align || 'center';

  const updateBlock = (updates: Partial<ImageBlockData>) => {
    onChange({ ...block, ...updates });
  };

  const getFlexAlign = () => {
    if (align === 'left') return 'items-start';
    if (align === 'right') return 'items-end';
    return 'items-center';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    
    if (containerRef.current && containerRef.current.parentElement) {
       setIsResizing(true);
       dragStartRef.current = {
         startX: e.clientX,
         startWidth: containerRef.current.offsetWidth,
         parentWidth: containerRef.current.parentElement.offsetWidth
       };
       setLocalWidth(block.width || 100);
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current) return;
        const { startX, startWidth, parentWidth } = dragStartRef.current;
        const currentAlign = blockRef.current.align || 'center';
        
        let deltaX = e.clientX - startX;
        
        if (currentAlign === 'center') {
            deltaX *= 2; 
        }
        
        const newPixelWidth = Math.max(50, startWidth + deltaX);
        const newPercent = Math.min(100, Math.max(10, (newPixelWidth / parentWidth) * 100));
        
        setLocalWidth(newPercent);
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        if (localWidth !== null) {
            onChange({ ...blockRef.current, width: localWidth });
        }
        setLocalWidth(null);
        dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, localWidth, onChange]);

  return (
    <div className={`flex flex-col ${getFlexAlign()} w-full relative group/image`}>
      <div 
        ref={containerRef}
        className={`relative ${isResizing ? '' : 'transition-all duration-300 ease-in-out'}`}
        style={{ width: `${width}%` }}
      >
        <img 
          src={block.url} 
          alt="User uploaded content" 
          className="w-full h-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 select-none"
        />

        {!readOnly && (
            <div
                onMouseDown={handleMouseDown}
                className={`absolute bottom-2 right-2 w-5 h-5 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full cursor-nwse-resize shadow-md z-20 
                    ${isResizing ? 'opacity-100 scale-125' : 'opacity-0 group-hover/image:opacity-100'} 
                    transition-all duration-200 touch-none`}
                title="Resize Image"
            />
        )}

        {!readOnly && !isResizing && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 bg-black/70 backdrop-blur-md p-1.5 rounded-lg opacity-100 sm:opacity-0 sm:group-hover/image:opacity-100 transition-opacity z-10 shadow-lg">
            <div className="flex bg-white/10 rounded">
                <button onClick={() => updateBlock({ align: 'left' })} className={`p-1.5 text-white hover:bg-white/20 rounded-l ${align === 'left' ? 'bg-blue-500' : ''}`} title="Align Left">
                    <Icons.AlignLeft size={14} />
                </button>
                <button onClick={() => updateBlock({ align: 'center' })} className={`p-1.5 text-white hover:bg-white/20 ${align === 'center' ? 'bg-blue-500' : ''}`} title="Align Center">
                    <Icons.AlignCenter size={14} />
                </button>
                <button onClick={() => updateBlock({ align: 'right' })} className={`p-1.5 text-white hover:bg-white/20 rounded-r ${align === 'right' ? 'bg-blue-500' : ''}`} title="Align Right">
                    <Icons.AlignRight size={14} />
                </button>
            </div>
            
            <div className="w-px bg-white/30 mx-1 self-stretch"></div>

            <div className="flex bg-white/10 rounded">
                <button onClick={() => updateBlock({ width: 25 })} className={`px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20 rounded-l ${width === 25 ? 'bg-blue-500' : ''}`}>S</button>
                <button onClick={() => updateBlock({ width: 50 })} className={`px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20 ${width === 50 ? 'bg-blue-500' : ''}`}>M</button>
                <button onClick={() => updateBlock({ width: 75 })} className={`px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20 ${width === 75 ? 'bg-blue-500' : ''}`}>L</button>
                <button onClick={() => updateBlock({ width: 100 })} className={`px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20 rounded-r ${width === 100 ? 'bg-blue-500' : ''}`}>Full</button>
            </div>
          </div>
        )}
      </div>

      {!readOnly && (
        <input
          type="text"
          placeholder="Add a caption..."
          value={block.caption || ''}
          onChange={(e) => updateBlock({ caption: e.target.value })}
          className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 outline-none transition-colors w-full max-w-md"
        />
      )}
      {readOnly && block.caption && (
          <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 italic">
              {block.caption}
          </div>
      )}
    </div>
  );
};

const DrawingBlock: React.FC<{block: DrawingBlockData, onChange: any, readOnly: boolean}> = ({ block, onChange, readOnly }) => {
  return (
    <div className="w-full">
      <DrawingCanvas 
        initialData={block.dataUrl} 
        onChange={(data) => onChange({...block, dataUrl: data})}
        readOnly={readOnly}
      />
      {!readOnly && (
        <div className="text-center mt-1 text-xs text-gray-400 font-sans">
          Draw your diagram above
        </div>
      )}
    </div>
  );
};
