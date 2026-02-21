/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Copy, 
  Download, 
  RefreshCw, 
  Palette, 
  Zap, 
  Sun, 
  Droplets, 
  Thermometer,
  Check,
  ExternalLink,
  Github,
  Twitter,
  Share2,
  FileCode,
  FileImage,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { extractPalette } from './services/imageService';
import { 
  getColorFormats, 
  getAnalogous, 
  getShades, 
  getTones, 
  getTriads, 
  getComplementary, 
  adjustColor,
  checkContrast,
  normalizeHex
} from './services/colorService';
import confetti from 'canvas-confetti';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Toast = ({ message, visible }: { message: string, visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 border border-white/10"
      >
        <Check size={18} className="text-emerald-400" />
        <span className="text-sm font-medium">{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

interface ColorCardProps {
  color: string;
  index: number;
  onSelect: (c: string) => void;
  isSelected: boolean;
  onCopy: (c: string) => void;
  format: 'HEX' | 'RGB' | 'HSL';
  key?: React.Key;
}

const ColorCard = ({ 
  color, 
  index, 
  onSelect, 
  isSelected,
  onCopy,
  format
}: ColorCardProps) => {
  const formats = getColorFormats(color);
  const displayValue = format === 'HEX' ? formats.hex : format === 'RGB' ? formats.rgb : formats.hsl;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-2xl transition-all duration-300 cursor-pointer",
        isSelected ? "bg-white shadow-xl ring-2 ring-zinc-900" : "hover:bg-white/50"
      )}
      onClick={() => onSelect(color)}
    >
      <div 
        className="w-full aspect-square rounded-xl shadow-inner border border-black/5 flex items-end justify-end p-2"
        style={{ backgroundColor: color }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onCopy(displayValue); }}
          className="p-2 bg-white/20 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
        >
          <Copy size={16} className="text-white" />
        </button>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Color {index + 1}</span>
        <span className="text-[10px] font-mono font-bold text-zinc-800 truncate" title={displayValue}>{displayValue.toUpperCase()}</span>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>(['#141414', '#F27D26', '#E4E3E0', '#8E9299', '#FFFFFF']);
  const [selectedColor, setSelectedColor] = useState<string>(palette[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [colorFormat, setColorFormat] = useState<'HEX' | 'RGB' | 'HSL'>('HEX');
  
  // Adjustments
  const [brightness, setBrightness] = useState(0);
  const [saturation, setSaturation] = useState(1);
  const [warmth, setWarmth] = useState(0);

  // Sync URL state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const colors = params.get('colors');
    if (colors) {
      const colorList = colors.split(',').map(c => normalizeHex('#' + c));
      if (colorList.length === 5) {
        setPalette(colorList);
        setSelectedColor(colorList[0]);
      }
    }
  }, []);

  const updateUrl = (colors: string[]) => {
    const hexList = colors.map(c => c.replace('#', '')).join(',');
    const newUrl = `${window.location.origin}${window.location.pathname}?colors=${hexList}`;
    window.history.replaceState({}, '', newUrl);
  };

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copiado: ${text}`);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent | ClipboardEvent) => {
    let file: File | null = null;

    // 1. Clipboard
    if ('clipboardData' in e && e.clipboardData) {
      const items = Array.from(e.clipboardData.items) as DataTransferItem[];
      const item = items.find(i => i.type.startsWith('image'));
      if (item) file = item.getAsFile();
    } 
    // 2. Drag & Drop
    else if ('dataTransfer' in e && e.dataTransfer) {
      file = e.dataTransfer.files[0];
    } 
    // 3. File Input
    else if ('target' in e && (e.target as HTMLInputElement).files) {
      const target = e.target as HTMLInputElement;
      file = target.files?.[0] || null;
      target.value = ''; // Reset to allow selecting same file again
    }

    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const url = event.target?.result as string;
        setImage(url);
        try {
          const colors = await extractPalette(url);
          setPalette(colors);
          setSelectedColor(colors[0]);
          // Reset adjustments for new palette
          setBrightness(0);
          setSaturation(1);
          setWarmth(0);
          updateUrl(colors);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (err) {
          console.error(err);
          showToast('Error al procesar imagen');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    handleImageUpload(e as any);
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const adjustedColor = adjustColor(selectedColor, brightness, saturation, warmth);

  const variations = React.useMemo(() => [
    { label: 'Análogos', colors: getAnalogous(adjustedColor) },
    { label: 'Tríadas', colors: getTriads(adjustedColor) },
    { label: 'Sombras', colors: getShades(adjustedColor) },
    { label: 'Tonos', colors: getTones(adjustedColor) },
  ], [adjustedColor]);

  const updatePaletteColor = (newColor: string) => {
    const newPalette = palette.map(c => c === selectedColor ? newColor : c);
    setPalette(newPalette);
    setSelectedColor(newColor);
    updateUrl(newPalette);
  };

  const downloadCSS = () => {
    const css = `:root {
  --color-1: ${palette[0]};
  --color-2: ${palette[1]};
  --color-3: ${palette[2]};
  --color-4: ${palette[3]};
  --color-5: ${palette[4]};
  --gradient-primary: linear-gradient(135deg, ${palette[0]}, ${palette[1]});
}

.bg-primary { background-color: var(--color-1); }
.text-primary { color: var(--color-1); }
.border-primary { border-color: var(--color-1); }
`;
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'colores.css';
    a.click();
    showToast('Archivo CSS descargado');
  };

  const downloadPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#F5F5F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#141414';
    ctx.font = 'bold 40px Inter';
    ctx.fillText('ABEJORRO DIGITAL COLOR', 50, 80);
    ctx.font = '20px Inter';
    ctx.fillText('PALETA DE DISEÑO GENERADA', 50, 115);

    // Swatches
    palette.forEach((color, i) => {
      const x = 50 + i * 185;
      const y = 180;
      const w = 160;
      const h = 250;

      // Shadow-like effect
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(x + 5, y + 5, w, h);

      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#141414';
      ctx.font = 'bold 24px JetBrains Mono';
      ctx.fillText(color.toUpperCase(), x, y + h + 40);
      ctx.font = '14px Inter';
      ctx.fillStyle = '#8E9299';
      ctx.fillText(`COLOR ${i + 1}`, x, y + h + 65);
    });

    const link = document.createElement('a');
    link.download = 'paleta-abejorro.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Imagen PNG descargada');
  };

  const downloadSVG = () => {
    const swatches = palette.map((c, i) => `
      <g transform="translate(${50 + i * 120}, 100)">
        <rect width="100" height="150" fill="${c}" rx="8" />
        <text y="180" font-family="monospace" font-size="12" font-weight="bold">${c.toUpperCase()}</text>
        <text y="195" font-family="sans-serif" font-size="10" fill="#888">COLOR ${i + 1}</text>
      </g>
    `).join('');

    const svg = `
      <svg width="700" height="300" viewBox="0 0 700 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#F5F5F0" />
        <text x="50" y="50" font-family="sans-serif" font-size="24" font-weight="bold">ABEJORRO DIGITAL COLOR</text>
        ${swatches}
      </svg>
    `;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paleta-abejorro.svg';
    a.click();
    showToast('Archivo SVG descargado');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      <Toast {...toast} />

      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white rotate-12">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">Abejorro Digital</h1>
              <p className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase">Color Engineering Lab</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                showToast('Link de paleta copiado');
              }}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <Share2 size={20} />
            </button>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex gap-2">
              <a href="#" className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><Github size={20} /></a>
              <a href="#" className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><Twitter size={20} /></a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Input & Palette */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* Upload Zone */}
          <section>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageUpload(e); }}
              className={cn(
                "relative h-80 rounded-[2.5rem] border-2 border-dashed border-zinc-200 bg-white flex flex-col items-center justify-center transition-all duration-500 overflow-hidden group",
                isProcessing && "animate-pulse"
              )}
            >
              {image ? (
                <>
                  <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" alt="" />
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                      <img src={image} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                    <label className="cursor-pointer bg-zinc-900 text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform shadow-xl">
                      <RefreshCw size={16} />
                      Cambiar Imagen
                      <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                    </label>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-6 p-12 text-center">
                  <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-300 group-hover:scale-110 group-hover:bg-zinc-100 transition-all duration-500">
                    <Upload size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">Suelta una imagen aquí</h3>
                    <p className="text-sm text-zinc-400 font-medium max-w-xs">Arrastra, pega o selecciona un archivo para extraer su ADN cromático.</p>
                  </div>
                  <label className="cursor-pointer bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                    Seleccionar Archivo
                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Palette Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 flex items-center gap-2">
                <Palette size={14} /> Paleta Extraída
              </h2>
              <button 
                onClick={() => updatePaletteColor(adjustedColor)}
                className="text-xs font-bold text-zinc-900 underline underline-offset-4 hover:opacity-70"
              >
                Aplicar Ajustes
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {palette.map((color, idx) => (
                <ColorCard 
                  key={idx} 
                  color={color} 
                  index={idx} 
                  onSelect={setSelectedColor}
                  isSelected={selectedColor === color}
                  onCopy={handleCopy}
                  format={colorFormat}
                />
              ))}
            </div>
          </section>

          {/* Manipulation */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-zinc-100 space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-3">
                <Layers size={20} className="text-zinc-400" />
                Refinamiento Cromático
              </h2>
              <div className="flex gap-2">
                {(['HEX', 'RGB', 'HSL'] as const).map(f => (
                  <button 
                    key={f} 
                    onClick={() => setColorFormat(f)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-black rounded-md transition-all",
                      colorFormat === f ? "bg-zinc-900 text-white shadow-md" : "bg-zinc-50 text-zinc-400 hover:text-zinc-900"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Sun size={14} /> Brillo
                    </label>
                    <span className="text-xs font-mono font-bold">{brightness > 0 ? '+' : ''}{brightness}</span>
                  </div>
                  <input 
                    type="range" min="-50" max="50" value={brightness} 
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900" 
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Droplets size={14} /> Saturación
                    </label>
                    <span className="text-xs font-mono font-bold">{saturation.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" min="0" max="2" step="0.1" value={saturation} 
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900" 
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Thermometer size={14} /> Calidez
                    </label>
                    <span className="text-xs font-mono font-bold">{warmth > 0 ? '+' : ''}{warmth}°</span>
                  </div>
                  <input 
                    type="range" min="-180" max="180" value={warmth} 
                    onChange={(e) => setWarmth(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900" 
                  />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-6">
                <div className="relative group">
                  <div 
                    className="w-40 h-40 rounded-full shadow-2xl border-8 border-white transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundColor: adjustedColor }}
                  />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-xl shadow-lg border border-zinc-100">
                    <span className="text-[10px] font-mono font-bold">
                      {colorFormat === 'HEX' ? getColorFormats(adjustedColor).hex.toUpperCase() : 
                       colorFormat === 'RGB' ? getColorFormats(adjustedColor).rgb.toUpperCase() : 
                       getColorFormats(adjustedColor).hsl.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => updatePaletteColor(adjustedColor)}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Actualizar en Paleta
                </button>
              </div>
            </div>
          </section>

          {/* Variations */}
          <section className="space-y-8">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Armonías y Variaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {variations.map((group, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-zinc-100 space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{group.label}</span>
                  <div className="flex gap-2">
                    {group.colors.map((c, idx) => (
                      <div 
                        key={idx} 
                        className="flex-1 h-12 rounded-xl cursor-pointer hover:scale-105 transition-transform border border-black/5"
                        style={{ backgroundColor: c }}
                        onClick={() => handleCopy(c)}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Similar Palettes */}
          <section className="space-y-8">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Explorar paletas similares</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['#2C3E50', '#E74C3C', '#ECF0F1', '#3498DB', '#2980B9'],
                ['#1B1B1B', '#FFD700', '#F5F5F5', '#C0C0C0', '#808080'],
                ['#2D5A27', '#F1C40F', '#FFFFFF', '#E67E22', '#D35400']
              ].map((p, i) => (
                <div 
                  key={i} 
                  className="bg-white p-4 rounded-3xl border border-zinc-100 cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => {
                    setPalette(p);
                    setSelectedColor(p[0]);
                    updateUrl(p);
                    showToast('Paleta sugerida aplicada');
                  }}
                >
                  <div className="flex h-12 rounded-xl overflow-hidden mb-3">
                    {p.map((c, idx) => (
                      <div key={idx} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-900 transition-colors">Sugerencia {i + 1}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Preview & Export */}
        <div className="lg:col-span-5 space-y-12">
          
          {/* Component Preview */}
          <section className="sticky top-32 space-y-8">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">UI Preview System</h2>
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-zinc-100 space-y-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6">
                <div className="w-12 h-12 rounded-full blur-3xl opacity-20" style={{ backgroundColor: palette[1] }} />
              </div>

              {/* Card Preview */}
              <div className="space-y-6">
                <div className="p-8 rounded-3xl border border-zinc-100 space-y-6" style={{ backgroundColor: palette[3] + '10' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: palette[1] }}>
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg" style={{ color: palette[4] }}>Dynamic Card</h4>
                      <p className="text-sm opacity-60" style={{ color: palette[4] }}>Testing visual hierarchy</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: palette[4] }}>
                    Este componente utiliza el Color 4 para el fondo de superficie y el Color 2 para acentos visuales.
                  </p>
                  <div className="flex gap-3">
                    <button className="flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-transform active:scale-95" style={{ backgroundColor: palette[1] }}>
                      Acción Principal
                    </button>
                    <button className="flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-colors" style={{ borderColor: palette[2], color: palette[1] }}>
                      Secundario
                    </button>
                  </div>
                </div>

                {/* Form Preview */}
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-50" style={{ color: palette[4] }}>Input Field</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Escribe algo..." 
                      className="w-full px-6 py-4 rounded-2xl border-2 bg-transparent outline-none transition-all"
                      style={{ borderColor: palette[2], color: palette[4] }}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ImageIcon size={20} style={{ color: palette[1] }} />
                    </div>
                  </div>
                </div>

                {/* Contrast Badge */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50">
                  <span className="text-xs font-bold text-zinc-400">Contraste (Texto/Fondo)</span>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                      checkContrast(palette[4], palette[0]).aa ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      WCAG {checkContrast(palette[4], palette[0]).aa ? 'PASS' : 'FAIL'}
                    </div>
                    <span className="text-xs font-mono font-bold">{checkContrast(palette[4], palette[0]).ratio}:1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Panel */}
            <div className="bg-zinc-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold tracking-tight">Exportar Activos</h3>
                <FileCode size={20} className="text-zinc-500" />
              </div>

              <div className="space-y-4">
                <button 
                  onClick={downloadCSS}
                  className="w-full group flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                      <FileCode size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Variables CSS</p>
                      <p className="text-[10px] text-zinc-500 font-medium">colores.css (Root & Utilities)</p>
                    </div>
                  </div>
                  <Download size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                </button>

                <button 
                  onClick={downloadPNG}
                  className="w-full group flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                      <FileImage size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Muestrario PNG</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Exportación de alta resolución</p>
                    </div>
                  </div>
                  <Download size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                </button>

                <button 
                  onClick={downloadSVG}
                  className="w-full group flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                      <Layers size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Vectorial SVG</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Compatible con Figma/Adobe</p>
                    </div>
                  </div>
                  <Download size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                </button>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Zap size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Abejorro v1.0.4 - Ready for Production</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-zinc-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
                <Zap size={16} fill="currentColor" />
              </div>
              <h4 className="font-black uppercase italic tracking-tighter">Abejorro Digital</h4>
            </div>
            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              Herramienta de grado profesional para la extracción de paletas cromáticas y generación de activos de diseño. Construido para ingenieros que valoran la precisión visual.
            </p>
          </div>
          <div className="space-y-4">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recursos</h5>
            <ul className="space-y-2 text-sm font-bold">
              <li><a href="#" className="hover:underline">Documentación API</a></li>
              <li><a href="#" className="hover:underline">Guía de Estilo</a></li>
              <li><a href="#" className="hover:underline">Changelog</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Legal</h5>
            <ul className="space-y-2 text-sm font-bold">
              <li><a href="#" className="hover:underline">Privacidad</a></li>
              <li><a href="#" className="hover:underline">Términos</a></li>
              <li><a href="#" className="hover:underline">Licencia MIT</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
