import { useEffect, useRef, useState, forwardRef } from 'react';
import { motion } from 'framer-motion';

const PdfCanvas = forwardRef(({ tool, pageWidth, pageHeight, scale = 1 }, ref) => {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [textInputs, setTextInputs] = useState([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [drawnElements, setDrawnElements] = useState([]);

  // Forward the canvas ref to parent
  useEffect(() => {
    if (ref) {
      ref.current = canvasRef.current;
    }
  }, [ref]);

  // Update canvas when dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set actual canvas dimensions (not display dimensions)
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    
    // Set display size through scaling
    canvas.style.width = `${pageWidth * scale}px`;
    canvas.style.height = `${pageHeight * scale}px`;

    // Scale all drawing operations to match display scale
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    redrawCanvas();
  }, [pageWidth, pageHeight, scale]);

  // Redraw when tool changes
  useEffect(() => {
    redrawCanvas();
  }, [tool]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawnElements.forEach(element => {
      ctx.beginPath();
      ctx.rect(element.x, element.y, element.width, element.height);
      
      if (element.type === 'blur') {
        // Enhanced blur effect
        ctx.filter = 'blur(8px)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
        // Gray outline for blur regions
        ctx.filter = 'none';
        ctx.strokeStyle = 'rgba(75, 85, 99, 0.5)'; // Gray-600 with 50% opacity
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (element.type === 'erase') {
        ctx.fillStyle = '#fff';
        ctx.fill();
        // Gray outline for eraser regions
        ctx.strokeStyle = 'rgba(75, 85, 99, 0.5)'; // Gray-600 with 50% opacity
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw text with enhanced styling
    textInputs.forEach(text => {
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = text.color || '#000';
      // Add slight shadow to text for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.fillText(text.content, text.x, text.y);
      ctx.shadowBlur = 0;
    });
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Convert display coordinates to actual canvas coordinates
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    if (!tool) return;

    const coords = getCanvasCoordinates(e);

    if (tool === 'text') {
      setTextInputPos(coords);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    setStartPos(coords);
  };

  const draw = (e) => {
    if (!isDrawing || tool === 'text' || !tool) return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw existing elements
    drawnElements.forEach(element => {
      ctx.beginPath();
      ctx.rect(element.x, element.y, element.width, element.height);
      if (element.type === 'blur') {
        ctx.filter = 'blur(8px)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
        ctx.filter = 'none';
        ctx.strokeStyle = 'rgba(75, 85, 99, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (element.type === 'erase') {
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(75, 85, 99, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw current shape
    ctx.beginPath();
    const width = coords.x - startPos.x;
    const height = coords.y - startPos.y;

    ctx.rect(
      Math.min(startPos.x, coords.x),
      Math.min(startPos.y, coords.y),
      Math.abs(width),
      Math.abs(height)
    );

    if (tool === 'blur') {
      ctx.filter = 'blur(8px)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.filter = 'none';
      ctx.strokeStyle = 'rgba(75, 85, 99, 0.6)'; // Slightly more opaque when drawing
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (tool === 'erase') {
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(75, 85, 99, 0.6)'; // Slightly more opaque when drawing
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Redraw text with enhanced styling
    textInputs.forEach(text => {
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = text.color || '#000';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.fillText(text.content, text.x, text.y);
      ctx.shadowBlur = 0;
    });
  };

  const stopDrawing = (e) => {
    if (!isDrawing || tool === 'text' || !tool) return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);

    // Add the new element
    setDrawnElements([
      ...drawnElements,
      {
        type: tool,
        x: Math.min(startPos.x, coords.x),
        y: Math.min(startPos.y, coords.y),
        width: Math.abs(coords.x - startPos.x),
        height: Math.abs(coords.y - startPos.y)
      }
    ]);

    setIsDrawing(false);
  };

  const handleTextInput = (e) => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (text) {
        setTextInputs([
          ...textInputs,
          {
            content: text,
            x: textInputPos.x,
            y: textInputPos.y,
            color: '#000'
          }
        ]);
      }
      setShowTextInput(false);
    }
  };

  return (
    <div 
      className="absolute top-0 left-0 w-full h-full" 
      ref={overlayRef}
      style={{ 
        touchAction: 'none',
        cursor: tool ? 'crosshair' : 'default'
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        style={{
          touchAction: 'none',
          width: `${pageWidth * scale}px`,
          height: `${pageHeight * scale}px`
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      {showTextInput && (
        <motion.input
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          type="text"
          className="absolute z-20 bg-gradient-to-r from-slate-800/90 to-slate-900/90 border border-slate-700/50 text-white p-2 rounded-lg text-sm backdrop-blur-sm"
          style={{
            left: `${textInputPos.x * scale}px`,
            top: `${textInputPos.y * scale}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}
          autoFocus
          onKeyDown={handleTextInput}
          onBlur={() => setShowTextInput(false)}
          placeholder="Type your text..."
        />
      )}
    </div>
  );
});

export default PdfCanvas;