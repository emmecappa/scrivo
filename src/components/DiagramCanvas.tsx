import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  MousePointer2,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Type,
  Trash2,
  Move,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Palette,
  Download,
} from 'lucide-react';

interface DiagramShape {
  id: string;
  type: 'rectangle' | 'circle' | 'diamond' | 'text' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  fillColor: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function DiagramCanvas() {
  const { currentPageId, pages, updatePage } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<DiagramShape[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'rectangle' | 'circle' | 'diamond' | 'text' | 'arrow'>('select');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<DiagramShape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [editingText, setEditingText] = useState<{ id: string; x: number; y: number } | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const currentPage = pages.find(p => p.id === currentPageId);

  // Load diagram data from page
  useEffect(() => {
    if (currentPage) {
      try {
        const diagramData = (currentPage as any).diagram_data;
        if (diagramData) {
          const data = JSON.parse(diagramData);
          setShapes(data.shapes || []);
          setConnections(data.connections || []);
        }
      } catch (e) {
        // No diagram data
      }
    }
  }, [currentPageId]);

  // Save diagram data
  const saveDiagram = useCallback((newShapes: DiagramShape[], newConnections: Connection[]) => {
    if (!currentPageId) return;
    const data = JSON.stringify({ shapes: newShapes, connections: newConnections });
    updatePage(currentPageId, { diagram_data: data } as any);
  }, [currentPageId]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Background grid
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = -pan.x / zoom; x < (rect.width - pan.x) / zoom; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -pan.y / zoom);
      ctx.lineTo(x, (rect.height - pan.y) / zoom);
      ctx.stroke();
    }
    for (let y = -pan.y / zoom; y < (rect.height - pan.y) / zoom; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-pan.x / zoom, y);
      ctx.lineTo((rect.width - pan.x) / zoom, y);
      ctx.stroke();
    }

    // Draw connections
    connections.forEach(conn => {
      const fromShape = shapes.find(s => s.id === conn.from);
      const toShape = shapes.find(s => s.id === conn.to);
      if (fromShape && toShape) {
        ctx.beginPath();
        ctx.strokeStyle = '#6B7280';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        const fromCenter = { x: fromShape.x + fromShape.width / 2, y: fromShape.y + fromShape.height / 2 };
        const toCenter = { x: toShape.x + toShape.width / 2, y: toShape.y + toShape.height / 2 };
        
        ctx.moveTo(fromCenter.x, fromCenter.y);
        ctx.lineTo(toCenter.x, toCenter.y);
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x);
        ctx.beginPath();
        ctx.moveTo(toCenter.x, toCenter.y);
        ctx.lineTo(toCenter.x - 10 * Math.cos(angle - Math.PI / 6), toCenter.y - 10 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toCenter.x - 10 * Math.cos(angle + Math.PI / 6), toCenter.y - 10 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = '#6B7280';
        ctx.fill();
      }
    });

    // Draw shapes
    shapes.forEach(shape => {
      ctx.fillStyle = shape.fillColor || '#ffffff';
      ctx.strokeStyle = shape.color || '#3B82F6';
      ctx.lineWidth = 2;

      if (shape.id === selectedShape) {
        ctx.shadowColor = '#3B82F6';
        ctx.shadowBlur = 8;
      }

      switch (shape.type) {
        case 'rectangle':
          ctx.beginPath();
          ctx.roundRect(shape.x, shape.y, shape.width, shape.height, 8);
          ctx.fill();
          ctx.stroke();
          break;
        case 'circle':
          ctx.beginPath();
          ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(shape.x + shape.width / 2, shape.y);
          ctx.lineTo(shape.x + shape.width, shape.y + shape.height / 2);
          ctx.lineTo(shape.x + shape.width / 2, shape.y + shape.height);
          ctx.lineTo(shape.x, shape.y + shape.height / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        case 'text':
          ctx.font = '16px Inter, sans-serif';
          ctx.fillStyle = '#1F2937';
          ctx.fillText(shape.text, shape.x, shape.y + 20);
          break;
      }

      ctx.shadowBlur = 0;

      // Draw text
      if (shape.text && shape.type !== 'text') {
        ctx.fillStyle = '#1F2937';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shape.text, shape.x + shape.width / 2, shape.y + shape.height / 2);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      }
    });

    ctx.restore();
  }, [shapes, connections, selectedShape, zoom, pan]);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  };

  const findShapeAt = (x: number, y: number): DiagramShape | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height) {
        return shape;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    
    if (selectedTool === 'select') {
      const shape = findShapeAt(coords.x, coords.y);
      if (shape) {
        setSelectedShape(shape.id);
        setIsDragging(true);
        setDragOffset({ x: coords.x - shape.x, y: coords.y - shape.y });
      } else {
        setSelectedShape(null);
      }
    } else {
      setIsDrawing(true);
      setDrawStart(coords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    
    if (isDragging && selectedShape) {
      setShapes(prev => prev.map(s => 
        s.id === selectedShape 
          ? { ...s, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
          : s
      ));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDrawing && selectedTool !== 'select') {
      const coords = getCanvasCoords(e);
      const width = Math.abs(coords.x - drawStart.x);
      const height = Math.abs(coords.y - drawStart.y);
      
      if (width > 10 || height > 10) {
        const newShape: DiagramShape = {
          id: `shape_${Date.now()}`,
          type: selectedTool === 'text' ? 'text' : selectedTool as any,
          x: Math.min(drawStart.x, coords.x),
          y: Math.min(drawStart.y, coords.y),
          width: Math.max(width, 60),
          height: Math.max(height, 40),
          text: '',
          color: selectedColor,
          fillColor: '#ffffff',
        };
        
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        setSelectedShape(newShape.id);
        saveDiagram(newShapes, connections);
        
        // Save to history
        const newHistory = [...history.slice(0, historyIndex + 1), newShapes];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
    
    if (isDragging && selectedShape) {
      saveDiagram(shapes, connections);
    }
    
    setIsDrawing(false);
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    const shape = findShapeAt(coords.x, coords.y);
    if (shape) {
      const text = prompt('Testo:', shape.text);
      if (text !== null) {
        const newShapes = shapes.map(s => s.id === shape.id ? { ...s, text } : s);
        setShapes(newShapes);
        saveDiagram(newShapes, connections);
      }
    }
  };

  const deleteSelected = () => {
    if (!selectedShape) return;
    const newShapes = shapes.filter(s => s.id !== selectedShape);
    const newConnections = connections.filter(c => c.from !== selectedShape && c.to !== selectedShape);
    setShapes(newShapes);
    setConnections(newConnections);
    setSelectedShape(null);
    saveDiagram(newShapes, newConnections);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShapes(history[historyIndex + 1]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-2 bg-white">
        <ToolButton
          active={selectedTool === 'select'}
          onClick={() => setSelectedTool('select')}
          title="Seleziona (V)"
        >
          <MousePointer2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          active={selectedTool === 'rectangle'}
          onClick={() => setSelectedTool('rectangle')}
          title="Rettangolo (R)"
        >
          <Square className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          active={selectedTool === 'circle'}
          onClick={() => setSelectedTool('circle')}
          title="Cerchio (C)"
        >
          <Circle className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          active={selectedTool === 'diamond'}
          onClick={() => setSelectedTool('diamond')}
          title="Rombo (D)"
        >
          <Diamond className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          active={selectedTool === 'text'}
          onClick={() => setSelectedTool('text')}
          title="Testo (T)"
        >
          <Type className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          active={selectedTool === 'arrow'}
          onClick={() => setSelectedTool('arrow')}
          title="Freccia (A)"
        >
          <ArrowRight className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map(color => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(color);
                if (selectedShape) {
                  const newShapes = shapes.map(s => s.id === selectedShape ? { ...s, color } : s);
                  setShapes(newShapes);
                  saveDiagram(newShapes, connections);
                }
              }}
              className={`w-5 h-5 rounded-full border-2 transition ${selectedColor === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        <ToolButton onClick={undo} title="Annulla">
          <Undo className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={redo} title="Ripeti">
          <Redo className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={deleteSelected} title="Elimina">
          <Trash2 className="w-4 h-4" />
        </ToolButton>

        <div className="flex-1" />

        <ToolButton onClick={() => setZoom(z => Math.min(z + 0.1, 3))} title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </ToolButton>
        <span className="text-xs text-gray-500 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
        <ToolButton onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </ToolButton>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ cursor: selectedTool === 'select' ? 'default' : 'crosshair' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
        
        {/* Empty state */}
        {shapes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-4xl mb-3">🎨</div>
              <p className="text-gray-400 text-sm">Seleziona uno strumento e disegna sul canvas</p>
              <p className="text-gray-300 text-xs mt-1">Doppio click su una forma per aggiungere testo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolButton({ children, onClick, active, title }: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition ${
        active ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
