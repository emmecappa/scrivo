import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import {
  MousePointer2,
  Square,
  Circle,
  Diamond,
  Type,
  Trash2,
  ZoomIn,
  ZoomOut,
  Pencil,
  Eraser,
  Image as ImageIcon,
  GripHorizontal,
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface DiagramShape {
  id: string;
  type: 'rectangle' | 'circle' | 'diamond' | 'text' | 'arrow' | 'image' | 'freehand';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  fillColor: string;
  points?: Point[];
  strokeWidth?: number;
  imageUrl?: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

type ToolType = 'select' | 'rectangle' | 'circle' | 'diamond' | 'text' | 'arrow' | 'pen' | 'eraser' | 'image';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#000000', '#FFFFFF'];
const STROKE_WIDTHS = [1, 2, 3, 5, 8, 12, 16];

export default function DiagramCanvas() {
  const { currentPageId } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shapes, setShapes] = useState<DiagramShape[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(2);
  const [currentFreehandPoints, setCurrentFreehandPoints] = useState<Point[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isRemoteUpdateRef = useRef(false);

  // Load diagram data with realtime listener
  useEffect(() => {
    if (!currentPageId || !isFirebaseConfigured || !db) return;

    console.log('🔄 Setting up realtime listener for page:', currentPageId);

    // Cleanup previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Listen to page changes in realtime
    unsubscribeRef.current = onSnapshot(
      doc(db, 'pages', currentPageId),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        const diagramData = data.diagram_data as string;

        if (diagramData && !isRemoteUpdateRef.current) {
          try {
            const parsed = JSON.parse(diagramData);
            console.log('✅ Diagram loaded from Firestore:', parsed.shapes?.length || 0, 'shapes');
            setShapes(parsed.shapes || []);
            setConnections(parsed.connections || []);
          } catch (e) {
            console.error('❌ Error parsing diagram data:', e);
          }
        }
      },
      (error) => {
        console.error('❌ Error listening to page:', error);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentPageId]);

  // Save diagram data directly to Firestore
  const saveDiagram = useCallback((newShapes: DiagramShape[], newConnections: Connection[]) => {
    if (!currentPageId || !isFirebaseConfigured || !db) {
      console.error('❌ Cannot save: missing prerequisites');
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set flag to prevent remote update loop
    isRemoteUpdateRef.current = true;

    // Debounce save (500ms)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const data = JSON.stringify({ shapes: newShapes, connections: newConnections });
        console.log('💾 Saving diagram:', newShapes.length, 'shapes');
        
        const pageRef = doc(db, 'pages', currentPageId);
        await setDoc(pageRef, { 
          diagram_ data,
          updated_at: new Date().toISOString()
        }, { merge: true });
        
        console.log('✅ Diagram saved successfully');
        
        // Reset flag after a short delay
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
      } catch (err) {
        console.error('❌ Error saving diagram:', err);
        isRemoteUpdateRef.current = false;
      }
    }, 500);
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
    
    // Save context and apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize;
    const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize;
    const endX = startX + (rect.width / zoom) + gridSize * 2;
    const endY = startY + (rect.height / zoom) + gridSize * 2;
    
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
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
        
        const fromCenter = { x: fromShape.x + fromShape.width / 2, y: fromShape.y + fromShape.height / 2 };
        const toCenter = { x: toShape.x + toShape.width / 2, y: toShape.y + toShape.height / 2 };
        
        ctx.moveTo(fromCenter.x, fromCenter.y);
        ctx.lineTo(toCenter.x, toCenter.y);
        ctx.stroke();
        
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
      const isSelected = shape.id === selectedShape;
      
      if (isSelected) {
        ctx.shadowColor = '#3B82F6';
        ctx.shadowBlur = 8;
      }

      switch (shape.type) {
        case 'rectangle':
          ctx.fillStyle = shape.fillColor || '#ffffff';
          ctx.strokeStyle = shape.color || '#3B82F6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(shape.x, shape.y, shape.width, shape.height, 8);
          ctx.fill();
          ctx.stroke();
          break;
          
        case 'circle':
          ctx.fillStyle = shape.fillColor || '#ffffff';
          ctx.strokeStyle = shape.color || '#3B82F6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
          
        case 'diamond':
          ctx.fillStyle = shape.fillColor || '#ffffff';
          ctx.strokeStyle = shape.color || '#3B82F6';
          ctx.lineWidth = 2;
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
          ctx.font = `${shape.strokeWidth || 16}px Inter, sans-serif`;
          ctx.fillStyle = shape.color || '#1F2937';
          ctx.fillText(shape.text, shape.x, shape.y + (shape.strokeWidth || 16));
          break;
          
        case 'image':
          if (shape.imageUrl) {
            const img = new window.Image();
            img.src = shape.imageUrl;
            img.onload = () => {
              ctx.drawImage(img, shape.x, shape.y, shape.width, shape.height);
              if (isSelected) {
                drawSelectionBox(ctx, shape);
              }
            };
          }
          break;
          
        case 'freehand':
          if (shape.points && shape.points.length > 1) {
            ctx.strokeStyle = shape.color || '#000000';
            ctx.lineWidth = shape.strokeWidth || 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            for (let i = 1; i < shape.points.length; i++) {
              ctx.lineTo(shape.points[i].x, shape.points[i].y);
            }
            ctx.stroke();
          }
          break;
      }

      ctx.shadowBlur = 0;

      if (shape.text && shape.type !== 'text' && shape.type !== 'freehand' && shape.type !== 'image') {
        ctx.fillStyle = '#1F2937';
        ctx.font = `${Math.min(14, shape.width / 10)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shape.text, shape.x + shape.width / 2, shape.y + shape.height / 2);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      }

      if (isSelected) {
        drawSelectionBox(ctx, shape);
      }
    });

    // Draw current freehand stroke
    if (currentFreehandPoints.length > 1) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = selectedStrokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentFreehandPoints[0].x, currentFreehandPoints[0].y);
      for (let i = 1; i < currentFreehandPoints.length; i++) {
        ctx.lineTo(currentFreehandPoints[i].x, currentFreehandPoints[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }, [shapes, connections, selectedShape, zoom, pan, currentFreehandPoints, selectedColor, selectedStrokeWidth]);

  const drawSelectionBox = (ctx: CanvasRenderingContext2D, shape: DiagramShape) => {
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    ctx.setLineDash([]);
    
    const handleSize = 8;
    const handles = [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x, y: shape.y + shape.height },
      { x: shape.x + shape.width, y: shape.y + shape.height },
      { x: shape.x + shape.width / 2, y: shape.y },
      { x: shape.x + shape.width / 2, y: shape.y + shape.height },
      { x: shape.x, y: shape.y + shape.height / 2 },
      { x: shape.x + shape.width, y: shape.y + shape.height / 2 },
    ];
    
    handles.forEach(handle => {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
  };

  const calculateBounds = (points: Point[]) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    return { minX, minY, maxX, maxY };
  };

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
      
      if (shape.type === 'freehand' && shape.points) {
        for (let j = 0; j < shape.points.length - 1; j++) {
          const p1 = shape.points[j];
          const p2 = shape.points[j + 1];
          const dist = distanceToLine(x, y, p1.x, p1.y, p2.x, p2.y);
          if (dist < (shape.strokeWidth || 2) + 5) {
            return shape;
          }
        }
      } else if (x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height) {
        return shape;
      }
    }
    return null;
  };

  const findResizeHandle = (x: number, y: number, shape: DiagramShape): number => {
    const handleSize = 10;
    const handles = [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x, y: shape.y + shape.height },
      { x: shape.x + shape.width, y: shape.y + shape.height },
      { x: shape.x + shape.width / 2, y: shape.y },
      { x: shape.x + shape.width / 2, y: shape.y + shape.height },
      { x: shape.x, y: shape.y + shape.height / 2 },
      { x: shape.x + shape.width, y: shape.y + shape.height / 2 },
    ];
    
    for (let i = 0; i < handles.length; i++) {
      if (Math.abs(x - handles[i].x) < handleSize && Math.abs(y - handles[i].y) < handleSize) {
        return i;
      }
    }
    return -1;
  };

  const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    
    if (selectedTool === 'select') {
      const selectedShapeObj = selectedShape ? shapes.find(s => s.id === selectedShape) : null;
      
      if (selectedShapeObj) {
        const handleIndex = findResizeHandle(coords.x, coords.y, selectedShapeObj);
        if (handleIndex >= 0) {
          setIsResizing(true);
          setResizeHandle(handleIndex.toString());
          setResizeStart({
            x: selectedShapeObj.x,
            y: selectedShapeObj.y,
            width: selectedShapeObj.width,
            height: selectedShapeObj.height,
          });
          setDrawStart(coords);
          return;
        }
      }
      
      const shape = findShapeAt(coords.x, coords.y);
      if (shape) {
        setSelectedShape(shape.id);
        setIsDragging(true);
        setDragOffset({ x: coords.x - shape.x, y: coords.y - shape.y });
      } else {
        setSelectedShape(null);
      }
    } else if (selectedTool === 'pen') {
      setIsDrawing(true);
      setCurrentFreehandPoints([coords]);
    } else if (selectedTool === 'eraser') {
      setIsDrawing(true);
      const shape = findShapeAt(coords.x, coords.y);
      if (shape) {
        const newShapes = shapes.filter(s => s.id !== shape.id);
        setShapes(newShapes);
        saveDiagram(newShapes, connections);
        if (selectedShape === shape.id) {
          setSelectedShape(null);
        }
      }
    } else if (selectedTool === 'image') {
      fileInputRef.current?.click();
    } else {
      setIsDrawing(true);
      setDrawStart(coords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }
    
    if (isResizing && selectedShape && resizeHandle !== null) {
      const dx = coords.x - drawStart.x;
      const dy = coords.y - drawStart.y;
      const handleIdx = parseInt(resizeHandle);
      
      const newShapes = shapes.map(s => {
        if (s.id !== selectedShape) return s;
        
        let newX = resizeStart.x;
        let newY = resizeStart.y;
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        
        // Handle indices: 0=NW, 1=NE, 2=SW, 3=SE, 4=N, 5=S, 6=W, 7=E
        if (handleIdx === 1 || handleIdx === 3 || handleIdx === 7) { // E
          newWidth = Math.max(20, resizeStart.width + dx);
        }
        if (handleIdx === 0 || handleIdx === 2 || handleIdx === 6) { // W
          newWidth = Math.max(20, resizeStart.width - dx);
          newX = resizeStart.x + dx;
        }
        if (handleIdx === 3 || handleIdx === 5 || handleIdx === 7) { // S
          newHeight = Math.max(20, resizeStart.height + dy);
        }
        if (handleIdx === 0 || handleIdx === 1 || handleIdx === 4) { // N
          newHeight = Math.max(20, resizeStart.height - dy);
          newY = resizeStart.y + dy;
        }
        
        return { ...s, x: newX, y: newY, width: newWidth, height: newHeight };
      });
      
      setShapes(newShapes);
      return;
    }
    
    if (isDragging && selectedShape) {
      const newShapes = shapes.map(s => 
        s.id === selectedShape 
          ? { ...s, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
          : s
      );
      setShapes(newShapes);
    }
    
    if (isDrawing && selectedTool === 'pen') {
      setCurrentFreehandPoints(prev => [...prev, coords]);
    }
    
    if (isDrawing && selectedTool === 'eraser') {
      const shape = findShapeAt(coords.x, coords.y);
      if (shape) {
        const newShapes = shapes.filter(s => s.id !== shape.id);
        setShapes(newShapes);
        if (selectedShape === shape.id) {
          setSelectedShape(null);
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      saveDiagram(shapes, connections);
      return;
    }
    
    if (isDrawing && selectedTool === 'pen' && currentFreehandPoints.length > 1) {
      const bounds = calculateBounds(currentFreehandPoints);
      const newShape: DiagramShape = {
        id: `freehand_${Date.now()}`,
        type: 'freehand',
        x: bounds.minX,
        y: bounds.minY,
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
        text: '',
        color: selectedColor,
        fillColor: 'transparent',
        points: [...currentFreehandPoints],
        strokeWidth: selectedStrokeWidth,
      };
      
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      saveDiagram(newShapes, connections);
      setCurrentFreehandPoints([]);
    } else if (isDrawing && selectedTool !== 'pen' && selectedTool !== 'eraser' && selectedTool !== 'image') {
      const coords = getCanvasCoords(e);
      const width = Math.abs(coords.x - drawStart.x);
      const height = Math.abs(coords.y - drawStart.y);
      
      if (width > 10 || height > 10) {
        const newShape: DiagramShape = {
          id: `shape_${Date.now()}`,
          type: selectedTool as any,
          x: Math.min(drawStart.x, coords.x),
          y: Math.min(drawStart.y, coords.y),
          width: Math.max(width, 60),
          height: Math.max(height, 40),
          text: '',
          color: selectedColor,
          fillColor: '#ffffff',
          strokeWidth: selectedStrokeWidth,
        };
        
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        setSelectedShape(newShape.id);
        saveDiagram(newShapes, connections);
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
    if (shape && shape.type !== 'freehand' && shape.type !== 'image') {
      const text = prompt('Testo:', shape.text);
      if (text !== null) {
        const newShapes = shapes.map(s => s.id === shape.id ? { ...s, text } : s);
        setShapes(newShapes);
        saveDiagram(newShapes, connections);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const newShape: DiagramShape = {
          id: `image_${Date.now()}`,
          type: 'image',
          x: 100,
          y: 100,
          width: img.width > 400 ? 400 : img.width,
          height: img.width > 400 ? (img.height * 400 / img.width) : img.height,
          text: '',
          color: '#000000',
          fillColor: 'transparent',
          imageUrl,
        };
        
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        setSelectedShape(newShape.id);
        saveDiagram(newShapes, connections);
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedShape) {
        deleteSelected();
      }
    }
    if (e.key === 'v') setSelectedTool('select');
    if (e.key === 'r') setSelectedTool('rectangle');
    if (e.key === 'c') setSelectedTool('circle');
    if (e.key === 'd') setSelectedTool('diamond');
    if (e.key === 't') setSelectedTool('text');
    if (e.key === 'p') setSelectedTool('pen');
    if (e.key === 'e') setSelectedTool('eraser');
    if (e.key === 'i') setSelectedTool('image');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-2 bg-white flex-wrap">
        <ToolButton active={selectedTool === 'select'} onClick={() => setSelectedTool('select')} title="Seleziona (V)">
          <MousePointer2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton active={selectedTool === 'rectangle'} onClick={() => setSelectedTool('rectangle')} title="Rettangolo (R)">
          <Square className="w-4 h-4" />
        </ToolButton>
        <ToolButton active={selectedTool === 'circle'} onClick={() => setSelectedTool('circle')} title="Cerchio (C)">
          <Circle className="w-4 h-4" />
        </ToolButton>
        <ToolButton active={selectedTool === 'diamond'} onClick={() => setSelectedTool('diamond')} title="Rombo (D)">
          <Diamond className="w-4 h-4" />
        </ToolButton>
        <ToolButton active={selectedTool === 'text'} onClick={() => setSelectedTool('text')} title="Testo (T)">
          <Type className="w-4 h-4" />
        </ToolButton>
        <ToolButton active={selectedTool === 'pen'} onClick={() => setSelectedTool('pen')} title="Matita (P)">
          <Pencil className="w-4 h-4" />
        </ToolButton>
        <ToolButton active={selectedTool === 'eraser'} onClick={() => setSelectedTool('eraser')} title="Gomma (E)">
          <Eraser className="w-4 h-4" />
        </ToolButton>
        <ToolButton active={selectedTool === 'image'} onClick={() => setSelectedTool('image')} title="Immagine (I)">
          <ImageIcon className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-6 bg-gray-200 mx-2" />

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

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Spessore:</span>
          {STROKE_WIDTHS.map(width => (
            <button
              key={width}
              onClick={() => {
                setSelectedStrokeWidth(width);
                if (selectedShape) {
                  const newShapes = shapes.map(s => s.id === selectedShape ? { ...s, strokeWidth: width } : s);
                  setShapes(newShapes);
                  saveDiagram(newShapes, connections);
                }
              }}
              className={`w-6 h-6 rounded flex items-center justify-center transition ${
                selectedStrokeWidth === width ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title={`${width}px`}
            >
              <div 
                className="bg-current rounded-full" 
                style={{ width: `${Math.min(width * 2, 16)}px`, height: `${Math.min(width * 2, 16)}px` }}
              />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <ToolButton onClick={deleteSelected} title="Elimina (Del)">
          <Trash2 className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        <ToolButton onClick={() => setZoom(z => Math.min(z + 0.1, 3))} title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </ToolButton>
        <span className="text-xs text-gray-500 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
        <ToolButton onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset zoom">
          <GripHorizontal className="w-4 h-4" />
        </ToolButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ 
            cursor: selectedTool === 'select' 
              ? (isDragging ? 'grabbing' : 'default')
              : 'crosshair'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
        
        {shapes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-4xl mb-3">🎨</div>
              <p className="text-gray-400 text-sm">Seleziona uno strumento e disegna sul canvas</p>
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
