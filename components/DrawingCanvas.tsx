import React, { useRef, useEffect, useState } from 'react';
import { Icons } from './Icon';

interface DrawingCanvasProps {
  initialData: string;
  onChange: (dataUrl: string) => void;
  readOnly?: boolean;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ initialData, onChange, readOnly = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    contextRef.current = ctx;

    // Load initial image if exists
    if (initialData) {
      const img = new Image();
      img.src = initialData;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
    }
  }, []); // Run once on mount to set up. Note: Resizing logic excluded for brevity, but critical for prod.

  // Update context when tools change
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    if (readOnly) return;
    contextRef.current?.closePath();
    setIsDrawing(false);
    save();
  };

  const save = () => {
    if (canvasRef.current) {
      // Use toDataURL to save the drawing as an image string
      const data = canvasRef.current.toDataURL('image/png');
      onChange(data);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { offsetX: 0, offsetY: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Note: rect dimensions might differ from internal width/height
      // Re-clearing with internal dimensions
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio); 
      save();
    }
  };

  return (
    <div className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-white relative group">
      {!readOnly && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 p-1 rounded shadow-sm border dark:border-gray-700 z-10">
           <input 
            type="color" 
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 cursor-pointer border-none bg-transparent"
            title="Brush Color"
          />
          <select 
            value={lineWidth} 
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="text-xs border rounded px-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            title="Brush Size"
          >
            <option value={1}>Fine</option>
            <option value={2}>Normal</option>
            <option value={4}>Thick</option>
            <option value={8}>Marker</option>
          </select>
          <button onClick={clearCanvas} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded" title="Clear">
            <Icons.Trash size={14} />
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-64 touch-none ${readOnly ? '' : 'cursor-crosshair'}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ width: '100%', height: '256px' }}
      />
      {readOnly && <div className="absolute inset-0 z-0" />} 
    </div>
  );
};

export default DrawingCanvas;