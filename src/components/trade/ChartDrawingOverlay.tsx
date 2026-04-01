import { useState, useRef, useEffect, useCallback } from 'react';
import { Minus, Trash2, Undo2, Target, X, Shield } from 'lucide-react';

export type DrawingTool = 'none' | 'hline' | 'trendline' | 'stoploss';

interface Drawing {
  id: string;
  type: 'hline' | 'trendline' | 'stoploss';
  // For hline / stoploss: y coordinate (price)
  priceY?: number;
  // For trendline: two points
  points?: { x: number; y: number }[];
  color: string;
  label?: string;
}

interface ChartDrawingOverlayProps {
  symbol: string;
  width: number;
  height: number;
  // Chart coordinate converters
  priceToCoor: (price: number) => number | null;
  coorToPrice: (y: number) => number | null;
  timeToCoor?: (time: number) => number | null;
  visible: boolean;
  onClose: () => void;
  /** Called when the user draws or drags a stop-loss line */
  onStopLossChange?: (price: number | null) => void;
}

const STORAGE_KEY_PREFIX = 'trevoros-drawings-';
const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
const SL_COLOR = '#dc2626'; // Red for stop-loss

function getStorageKey(symbol: string) {
  return `${STORAGE_KEY_PREFIX}${symbol}`;
}

function loadDrawings(symbol: string): Drawing[] {
  try {
    const raw = localStorage.getItem(getStorageKey(symbol));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDrawings(symbol: string, drawings: Drawing[]) {
  try {
    localStorage.setItem(getStorageKey(symbol), JSON.stringify(drawings));
  } catch {}
}

export default function ChartDrawingOverlay({
  symbol,
  width,
  height,
  priceToCoor,
  coorToPrice,
  visible,
  onClose,
  onStopLossChange,
}: ChartDrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawingTool>('none');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeColor, setActiveColor] = useState('#3b82f6');
  const [trendPoints, setTrendPoints] = useState<{ x: number; y: number }[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [draggingSL, setDraggingSL] = useState<string | null>(null);

  // Load drawings on mount / symbol change
  useEffect(() => {
    setDrawings(loadDrawings(symbol));
  }, [symbol]);

  // Save whenever drawings change
  useEffect(() => {
    saveDrawings(symbol, drawings);
  }, [drawings, symbol]);

  // Notify parent when SL changes
  useEffect(() => {
    if (!onStopLossChange) return;
    const slDrawing = drawings.find(d => d.type === 'stoploss');
    onStopLossChange(slDrawing?.priceY ?? null);
  }, [drawings, onStopLossChange]);

  // ─── Render drawings on canvas ────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    for (const d of drawings) {
      if ((d.type === 'hline' || d.type === 'stoploss') && d.priceY !== undefined) {
        const y = priceToCoor(d.priceY);
        if (y === null || y === undefined) continue;

        const isSL = d.type === 'stoploss';
        const color = isSL ? SL_COLOR : d.color;

        ctx.beginPath();
        ctx.setLineDash(isSL ? [8, 4] : [6, 4]);
        ctx.strokeStyle = color;
        ctx.lineWidth = isSL ? 2 : 1.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label badge
        const label = isSL ? `🛑 SL ₹${d.priceY.toFixed(2)}` : (d.label || `₹${d.priceY.toFixed(2)}`);
        ctx.font = `${isSL ? 'bold ' : ''}11px Inter, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        
        // Background pill
        const badgeX = isSL ? width - textWidth - 24 : 8;
        ctx.fillStyle = color + (isSL ? '25' : '20');
        const radius = 4;
        const bw = textWidth + 12;
        const bh = 20;
        const by = y - bh + 2;
        ctx.beginPath();
        ctx.moveTo(badgeX + radius, by);
        ctx.lineTo(badgeX + bw - radius, by);
        ctx.quadraticCurveTo(badgeX + bw, by, badgeX + bw, by + radius);
        ctx.lineTo(badgeX + bw, by + bh - radius);
        ctx.quadraticCurveTo(badgeX + bw, by + bh, badgeX + bw - radius, by + bh);
        ctx.lineTo(badgeX + radius, by + bh);
        ctx.quadraticCurveTo(badgeX, by + bh, badgeX, by + bh - radius);
        ctx.lineTo(badgeX, by + radius);
        ctx.quadraticCurveTo(badgeX, by, badgeX + radius, by);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = color;
        ctx.fillText(label, badgeX + 6, y - 3);

        // Drag handle for SL
        if (isSL) {
          ctx.beginPath();
          ctx.arc(width - textWidth - 34, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = SL_COLOR;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(width - textWidth - 34, y, 7, 0, Math.PI * 2);
          ctx.strokeStyle = SL_COLOR + '40';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      if (d.type === 'trendline' && d.points && d.points.length === 2) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1.5;
        ctx.moveTo(d.points[0].x, d.points[0].y);
        ctx.lineTo(d.points[1].x, d.points[1].y);
        ctx.stroke();

        // Draw end circles
        for (const pt of d.points) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.fill();
        }
      }
    }

    // Draw in-progress trendline
    if (tool === 'trendline' && trendPoints.length === 1 && mousePos) {
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = activeColor + '80';
      ctx.lineWidth = 1;
      ctx.moveTo(trendPoints[0].x, trendPoints[0].y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Crosshair for hline / stoploss tool
    if ((tool === 'hline' || tool === 'stoploss') && mousePos) {
      const isSLTool = tool === 'stoploss';
      const crossColor = isSLTool ? SL_COLOR : activeColor;
      
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = crossColor + '60';
      ctx.lineWidth = 1;
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(width, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const price = coorToPrice(mousePos.y);
      if (price) {
        const label = isSLTool ? `🛑 SL ₹${price.toFixed(2)}` : `₹${price.toFixed(2)}`;
        ctx.fillStyle = crossColor;
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(label, mousePos.x + 12, mousePos.y - 5);
      }
    }
  }, [drawings, width, height, priceToCoor, coorToPrice, tool, activeColor, trendPoints, mousePos]);

  useEffect(() => {
    if (visible) render();
  }, [render, visible]);

  // ─── Mouse handlers ───────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top;

    // Check if clicking near a SL line to start drag
    const slDrawing = drawings.find(d => d.type === 'stoploss');
    if (slDrawing?.priceY !== undefined && tool === 'none') {
      const slY = priceToCoor(slDrawing.priceY);
      if (slY !== null && Math.abs(y - slY) < 10) {
        setDraggingSL(slDrawing.id);
        e.preventDefault();
        return;
      }
    }
  };

  const handleMouseUp = () => {
    if (draggingSL) {
      setDraggingSL(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingSL) return; // Don't click while dragging
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'hline') {
      const price = coorToPrice(y);
      if (price === null) return;
      const newDrawing: Drawing = {
        id: `d-${Date.now()}`,
        type: 'hline',
        priceY: price,
        color: activeColor,
      };
      setDrawings(prev => [...prev, newDrawing]);
      setTool('none');
    }

    if (tool === 'stoploss') {
      const price = coorToPrice(y);
      if (price === null) return;
      // Replace any existing SL drawing
      setDrawings(prev => [
        ...prev.filter(d => d.type !== 'stoploss'),
        {
          id: `sl-${Date.now()}`,
          type: 'stoploss',
          priceY: price,
          color: SL_COLOR,
        },
      ]);
      setTool('none');
    }

    if (tool === 'trendline') {
      if (trendPoints.length === 0) {
        setTrendPoints([{ x, y }]);
      } else if (trendPoints.length === 1) {
        const newDrawing: Drawing = {
          id: `d-${Date.now()}`,
          type: 'trendline',
          points: [trendPoints[0], { x, y }],
          color: activeColor,
        };
        setDrawings(prev => [...prev, newDrawing]);
        setTrendPoints([]);
        setTool('none');
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setMousePos(pos);

    // Handle SL drag
    if (draggingSL) {
      const newPrice = coorToPrice(pos.y);
      if (newPrice !== null && newPrice > 0) {
        setDrawings(prev => prev.map(d =>
          d.id === draggingSL ? { ...d, priceY: newPrice } : d
        ));
      }
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    if (draggingSL) setDraggingSL(null);
  };

  const handleUndo = () => {
    setDrawings(prev => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setDrawings([]);
    setTrendPoints([]);
  };

  if (!visible) return null;

  const hasSL = drawings.some(d => d.type === 'stoploss');

  return (
    <>
      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`absolute inset-0 z-20 ${
          draggingSL ? 'cursor-ns-resize' : tool !== 'none' ? 'cursor-crosshair' : 'pointer-events-none'
        }`}
        style={draggingSL ? { pointerEvents: 'auto' } : undefined}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Toolbar */}
      <div className="absolute top-12 right-3 z-30 flex flex-col gap-1 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border p-1.5 drawing-toolbar-glow animate-scale-in">
        {/* Tools */}
        <button
          onClick={() => { setTool(tool === 'hline' ? 'none' : 'hline'); setTrendPoints([]); }}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'hline' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Horizontal Line"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => { setTool(tool === 'trendline' ? 'none' : 'trendline'); setTrendPoints([]); }}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'trendline' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Trendline"
        >
          <Target size={16} />
        </button>
        <button
          onClick={() => { setTool(tool === 'stoploss' ? 'none' : 'stoploss'); setTrendPoints([]); }}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'stoploss' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={hasSL ? 'Move Stop Loss (click to replace)' : 'Set Stop Loss'}
        >
          <Shield size={16} />
        </button>

        <div className="border-t my-1" />

        {/* Color picker */}
        <div className="flex flex-wrap gap-1 px-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setActiveColor(c)}
              className={`w-4 h-4 rounded-full transition-transform ${activeColor === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="border-t my-1" />

        {/* Actions */}
        <button
          onClick={handleUndo}
          disabled={drawings.length === 0}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={handleClearAll}
          disabled={drawings.length === 0}
          className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Clear all"
        >
          <Trash2 size={16} />
        </button>

        <div className="border-t my-1" />

        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          title="Close drawing tools"
        >
          <X size={16} />
        </button>
      </div>

      {/* SL drag hint */}
      {hasSL && tool === 'none' && (
        <div className="absolute bottom-2 left-4 z-30 text-[10px] text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded animate-fade-in">
          Drag the 🛑 stop-loss line to adjust
        </div>
      )}
    </>
  );
}
