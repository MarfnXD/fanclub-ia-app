'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Loader2, Sparkles, Settings2,
  Palette, Type, X, Check, Save, Upload, Image, Pin, Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { PresetInfo, DesignTokens } from '@/lib/types';

interface ThemeEditorProps {
  presets: PresetInfo[];
  selectedPreset: string;
  customTokens: Partial<DesignTokens> | null;
  userId: string;
  onSelectPreset: (id: string) => void;
  onCustomTokens: (tokens: Partial<DesignTokens> | null) => void;
  onPresetsChanged: (presets: PresetInfo[]) => void;
}

function hexToRgb(hex: string) {
  const match = hex.match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1].slice(0, 2), 16),
    g: parseInt(match[1].slice(2, 4), 16),
    b: parseInt(match[1].slice(4, 6), 16),
  };
}

function adjustColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamp = (n: number) => Math.min(255, Math.max(0, n));
  const r = clamp(rgb.r + amount);
  const g = clamp(rgb.g + amount);
  const b = clamp(rgb.b + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = 0.2126 * rgb.r / 255 + 0.7152 * rgb.g / 255 + 0.0722 * rgb.b / 255;
  return luminance > 0.5;
}

function generatePalette(primary: string, accent: string) {
  const rgb = hexToRgb(primary);
  const rgbAccent = hexToRgb(accent);
  if (!rgb || !rgbAccent) return null;
  return {
    primary,
    'primary-light': adjustColor(primary, 30),
    'primary-lighter': adjustColor(primary, 70),
    'primary-dark': adjustColor(primary, -20),
    'primary-darker': adjustColor(primary, -40),
    'primary-glow': `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
    'primary-border': `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
    accent,
    'accent-glow': `rgba(${rgbAccent.r}, ${rgbAccent.g}, ${rgbAccent.b}, 0.15)`,
  };
}

const DISPLAY_FONTS = [
  { label: 'Unbounded', value: "'Unbounded', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Inter', value: "'Inter', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Space Grotesk', value: "'Space Grotesk', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Sora', value: "'Sora', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Montserrat', value: "'Montserrat', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Raleway', value: "'Raleway', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Outfit', value: "'Outfit', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Manrope', value: "'Manrope', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Figtree', value: "'Figtree', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Albert Sans', value: "'Albert Sans', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Epilogue', value: "'Epilogue', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Lexend', value: "'Lexend', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Red Hat Display', value: "'Red Hat Display', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Urbanist', value: "'Urbanist', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Work Sans', value: "'Work Sans', system-ui, sans-serif", cat: 'Sans' },
  { label: 'Playfair Display', value: "'Playfair Display', serif", cat: 'Serif' },
  { label: 'Fraunces', value: "'Fraunces', serif", cat: 'Serif' },
  { label: 'Cormorant Garamond', value: "'Cormorant Garamond', serif", cat: 'Serif' },
  { label: 'DM Serif Display', value: "'DM Serif Display', serif", cat: 'Serif' },
  { label: 'Libre Baskerville', value: "'Libre Baskerville', serif", cat: 'Serif' },
  { label: 'Lora', value: "'Lora', serif", cat: 'Serif' },
  { label: 'Merriweather', value: "'Merriweather', serif", cat: 'Serif' },
  { label: 'Bitter', value: "'Bitter', serif", cat: 'Serif' },
  { label: 'Crimson Pro', value: "'Crimson Pro', serif", cat: 'Serif' },
  { label: 'Bebas Neue', value: "'Bebas Neue', sans-serif", cat: 'Impact' },
  { label: 'Oswald', value: "'Oswald', sans-serif", cat: 'Impact' },
  { label: 'Anton', value: "'Anton', sans-serif", cat: 'Impact' },
  { label: 'Archivo Black', value: "'Archivo Black', sans-serif", cat: 'Impact' },
  { label: 'Righteous', value: "'Righteous', sans-serif", cat: 'Impact' },
];

const BODY_FONTS = [
  { label: 'Poppins', value: "'Poppins', system-ui, sans-serif" },
  { label: 'Inter', value: "'Inter', system-ui, sans-serif" },
  { label: 'DM Sans', value: "'DM Sans', system-ui, sans-serif" },
  { label: 'IBM Plex Sans', value: "'IBM Plex Sans', system-ui, sans-serif" },
  { label: 'Lato', value: "'Lato', system-ui, sans-serif" },
  { label: 'Nunito', value: "'Nunito', system-ui, sans-serif" },
  { label: 'Source Sans 3', value: "'Source Sans 3', system-ui, sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', system-ui, sans-serif" },
  { label: 'Roboto', value: "'Roboto', system-ui, sans-serif" },
  { label: 'Noto Sans', value: "'Noto Sans', system-ui, sans-serif" },
  { label: 'Rubik', value: "'Rubik', system-ui, sans-serif" },
  { label: 'Karla', value: "'Karla', system-ui, sans-serif" },
  { label: 'Barlow', value: "'Barlow', system-ui, sans-serif" },
  { label: 'Mulish', value: "'Mulish', system-ui, sans-serif" },
  { label: 'Quicksand', value: "'Quicksand', system-ui, sans-serif" },
  { label: 'Outfit', value: "'Outfit', system-ui, sans-serif" },
  { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { label: 'Red Hat Text', value: "'Red Hat Text', system-ui, sans-serif" },
  { label: 'Libre Franklin', value: "'Libre Franklin', system-ui, sans-serif" },
  { label: 'Figtree', value: "'Figtree', system-ui, sans-serif" },
  { label: 'Albert Sans', value: "'Albert Sans', system-ui, sans-serif" },
];

export function ThemeEditor({
  presets,
  selectedPreset,
  customTokens,
  userId,
  onSelectPreset,
  onCustomTokens,
  onPresetsChanged,
}: ThemeEditorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [brandResult, setBrandResult] = useState<string | null>(null);
  const [brandMeta, setBrandMeta] = useState<{ brand_name?: string; personality?: string; font_imports?: string } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [editColors, setEditColors] = useState<{ primary: string; accent: string } | null>(null);
  const [editBgColor, setEditBgColor] = useState<string | null>(null);
  const [editFonts, setEditFonts] = useState<{ display: string; body: string } | null>(null);
  const [customFontDisplay, setCustomFontDisplay] = useState('');
  const [customFontBody, setCustomFontBody] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const kvInputRef = useRef<HTMLInputElement>(null);

  const activePreset = presets.find(p => p.id === selectedPreset);
  // Filter out built-in "default" from visible presets
  const visiblePresets = presets.filter(p => p.custom);

  const currentPrimary = customTokens?.colors?.primary || activePreset?.colors.primary || '#9333EA';
  const currentAccent = customTokens?.colors?.accent || activePreset?.colors.accent || '#06B6D4';
  const currentDisplayFont = customTokens?.fonts?.display || activePreset?.fonts.display || "'Unbounded', system-ui, sans-serif";
  const currentBodyFont = customTokens?.fonts?.body || activePreset?.fonts.body || "'Poppins', system-ui, sans-serif";
  const currentLogoUrl = logoUrl || activePreset?.logo_url || null;
  const currentBgColor = editBgColor || '#0A0A0B';
  const lightBg = isLightColor(currentBgColor);
  const previewTextColor = lightBg ? '#1A1A2E' : '#FFFFFF';
  const previewTextMuted = lightBg ? '#4A4A6A' : 'rgba(255,255,255,0.6)';

  // Upload logo — salva no Storage + analisa com Claude Vision
  const handleLogoUpload = useCallback(async (file: File) => {
    setUploadingLogo(true);
    setAnalyzing(true);
    setBrandResult(null);
    setModalOpen(true);
    try {
      const [uploadRes, analysisRes] = await Promise.all([
        api.uploadLogo(file),
        api.analyzeBrand(file),
      ]);

      const url = uploadRes.logo_url;
      setLogoUrl(url);

      const { tokens: brandTokens } = analysisRes;
      setBrandResult(`${brandTokens.brand_name} — ${brandTokens.personality}`);
      setBrandMeta({
        brand_name: brandTokens.brand_name,
        personality: brandTokens.personality,
        font_imports: brandTokens.font_imports,
      });

      const palette = brandTokens.colors;
      const bgColor = brandTokens.background_color || '#0A0A0B';
      setEditBgColor(bgColor);

      onCustomTokens({
        ...customTokens,
        colors: palette,
        fonts: { display: brandTokens.fonts.display, body: brandTokens.fonts.body, mono: brandTokens.fonts.mono },
        logo_url: url,
        background_color: bgColor,
      } as Partial<DesignTokens>);

      setEditColors({ primary: palette.primary, accent: palette.accent });
      setEditFonts({ display: brandTokens.fonts.display, body: brandTokens.fonts.body });
      setSaveName(brandTokens.brand_name || '');
    } catch (err) {
      setBrandResult(`Erro: ${err instanceof Error ? err.message : 'falha'}`);
    } finally {
      setUploadingLogo(false);
      setAnalyzing(false);
    }
  }, [customTokens, onCustomTokens]);

  // Analyze KV — só extrai branding
  const handleKvAnalysis = useCallback(async (file: File) => {
    setAnalyzing(true);
    setBrandResult(null);
    setModalOpen(true);
    try {
      const { tokens } = await api.analyzeBrand(file);
      setBrandResult(`${tokens.brand_name} — ${tokens.personality}`);
      setBrandMeta({
        brand_name: tokens.brand_name,
        personality: tokens.personality,
        font_imports: tokens.font_imports,
      });

      const palette = tokens.colors;
      const bgColor = tokens.background_color || '#0A0A0B';
      setEditBgColor(bgColor);

      onCustomTokens({
        ...customTokens,
        colors: palette,
        fonts: { display: tokens.fonts.display, body: tokens.fonts.body, mono: tokens.fonts.mono },
        background_color: bgColor,
      } as Partial<DesignTokens>);

      if (tokens.style) {
        const match = presets.find(p => p.id === tokens.style);
        if (match) onSelectPreset(match.id);
      }

      setEditColors({ primary: palette.primary, accent: palette.accent });
      setEditFonts({ display: tokens.fonts.display, body: tokens.fonts.body });
      setSaveName(tokens.brand_name || '');
    } catch (err) {
      setBrandResult(`Erro: ${err instanceof Error ? err.message : 'Falha na analise'}`);
    } finally {
      setAnalyzing(false);
    }
  }, [customTokens, onCustomTokens, onSelectPreset, presets]);

  const handleColorChange = useCallback((type: 'primary' | 'accent' | 'background', value: string) => {
    if (type === 'background') {
      setEditBgColor(value);
      onCustomTokens({ ...customTokens, background_color: value } as Partial<DesignTokens>);
      return;
    }
    const primary = type === 'primary' ? value : (editColors?.primary || currentPrimary);
    const accent = type === 'accent' ? value : (editColors?.accent || currentAccent);
    setEditColors({ primary, accent });
    const palette = generatePalette(primary, accent);
    if (palette) {
      onCustomTokens({ ...customTokens, colors: palette });
    }
  }, [editColors, currentPrimary, currentAccent, customTokens, onCustomTokens]);

  const handleFontChange = useCallback((type: 'display' | 'body', value: string) => {
    const display = type === 'display' ? value : (editFonts?.display || currentDisplayFont);
    const body = type === 'body' ? value : (editFonts?.body || currentBodyFont);
    setEditFonts({ display, body });
    onCustomTokens({
      ...customTokens,
      fonts: { display, body, mono: customTokens?.fonts?.mono || activePreset?.fonts.mono || "'JetBrains Mono', monospace" },
    });
  }, [editFonts, currentDisplayFont, currentBodyFont, customTokens, onCustomTokens, activePreset]);

  const handleCustomFont = useCallback((type: 'display' | 'body', fontName: string) => {
    if (!fontName.trim()) return;
    const value = `'${fontName.trim()}', system-ui, sans-serif`;
    handleFontChange(type, value);
    if (type === 'display') setCustomFontDisplay('');
    else setCustomFontBody('');
  }, [handleFontChange]);

  const handleSavePreset = useCallback(async () => {
    if (!saveName.trim() || !customTokens?.colors) return;
    setSaving(true);
    try {
      const { preset } = await api.saveCustomPreset({
        user_id: userId,
        name: saveName.trim(),
        colors: customTokens.colors as unknown as Record<string, string>,
        fonts: (customTokens.fonts || activePreset?.fonts || {}) as unknown as Record<string, string>,
        radius: (customTokens.radius || activePreset?.radius || {}) as unknown as Record<string, string>,
        font_imports: brandMeta?.font_imports || undefined,
        brand_name: brandMeta?.brand_name || undefined,
        personality: brandMeta?.personality || undefined,
        logo_url: currentLogoUrl || undefined,
        background_color: editBgColor || undefined,
      });
      onPresetsChanged([...presets, preset]);
      onSelectPreset(preset.id);
      onCustomTokens(null);
      setSaveName('');
      setBrandResult(null);
      setBrandMeta(null);
      setLogoUrl(null);
      setEditColors(null);
      setEditBgColor(null);
      setEditFonts(null);
      setModalOpen(false);
    } catch (err) {
      setBrandResult(`Erro ao salvar: ${err instanceof Error ? err.message : 'falha'}`);
    } finally {
      setSaving(false);
    }
  }, [saveName, customTokens, userId, activePreset, brandMeta, currentLogoUrl, editBgColor, presets, onPresetsChanged, onSelectPreset, onCustomTokens]);

  const handleDeletePreset = useCallback(async (preset: PresetInfo) => {
    if (!preset.db_id) return;
    try {
      await api.deleteCustomPreset(preset.db_id);
      const updated = presets.filter(p => p.id !== preset.id);
      onPresetsChanged(updated);
      if (selectedPreset === preset.id) onSelectPreset('default');
    } catch { /* ignore */ }
  }, [presets, selectedPreset, onPresetsChanged, onSelectPreset]);

  const handleTogglePin = useCallback(async (preset: PresetInfo) => {
    if (!preset.db_id) return;
    try {
      const { pinned } = await api.togglePinPreset(preset.db_id);
      const updated = presets.map(p =>
        p.id === preset.id ? { ...p, pinned } : p
      ).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
      onPresetsChanged(updated);
    } catch { /* ignore */ }
  }, [presets, onPresetsChanged]);

  const openEditor = useCallback(() => {
    setEditColors({ primary: currentPrimary, accent: currentAccent });
    setEditFonts({ display: currentDisplayFont, body: currentBodyFont });
    if (activePreset?.logo_url && !logoUrl) setLogoUrl(activePreset.logo_url);
    setModalOpen(true);
  }, [currentPrimary, currentAccent, currentDisplayFont, currentBodyFont, activePreset, logoUrl]);

  const clearAll = useCallback(() => {
    onCustomTokens(null);
    setEditColors(null);
    setEditBgColor(null);
    setEditFonts(null);
    setLogoUrl(null);
    setBrandResult(null);
    setBrandMeta(null);
  }, [onCustomTokens]);

  return (
    <>
      {/* ===== INLINE BAR ===== */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-[#0C0C0E]">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
          {visiblePresets.length === 0 && (
            <span className="text-[10px] text-muted-foreground/50 italic px-1">Nenhum tema salvo</span>
          )}
          {visiblePresets.map((preset) => (
            <div key={preset.id} className="relative group shrink-0">
              <button
                onClick={() => {
                  onSelectPreset(preset.id);
                  onCustomTokens(null);
                  setEditColors(null);
                  setEditBgColor(null);
                  setEditFonts(null);
                  setLogoUrl(preset.logo_url || null);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium whitespace-nowrap transition-all pr-8',
                  selectedPreset === preset.id && !customTokens
                    ? 'border-primary/50 bg-primary/10 text-white'
                    : 'border-border/50 bg-transparent text-muted-foreground hover:border-border hover:text-white',
                )}
              >
                <div className="flex gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10" style={{ background: preset.colors.primary }} />
                  <div className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10" style={{ background: preset.colors.accent }} />
                </div>
                {preset.pinned && <Pin className="w-2 h-2 text-primary/80" />}
                {!preset.pinned && <Sparkles className="w-2 h-2 text-primary/60" />}
                {preset.name}
              </button>
              <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={(e) => { e.stopPropagation(); handleTogglePin(preset); }}
                  className={cn('p-0.5 rounded transition-colors', preset.pinned ? 'text-primary hover:text-primary/60' : 'text-muted-foreground hover:text-primary')}
                  title={preset.pinned ? 'Desafixar' : 'Fixar'}>
                  <Pin className="w-2.5 h-2.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset); }}
                  className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {customTokens && (
          <div className="flex items-center gap-0.5 shrink-0">
            <div className="flex gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full ring-1 ring-primary/30" style={{ background: currentPrimary }} />
              <div className="w-2.5 h-2.5 rounded-full ring-1 ring-primary/30" style={{ background: currentAccent }} />
            </div>
            <span className="text-[9px] text-primary font-medium">Custom</span>
          </div>
        )}

        <button onClick={openEditor}
          className="flex items-center gap-1 px-2 py-1 rounded-md border border-border/50 text-[10px] font-medium text-muted-foreground hover:text-white hover:border-border transition-all shrink-0">
          <Settings2 className="w-3 h-3" />
          Editar
        </button>
      </div>

      {/* Hidden file inputs */}
      <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
      <input ref={kvInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleKvAnalysis(f); e.target.value = ''; }} />

      {/* ===== MODAL ===== */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editor de Tema</DialogTitle>
            <DialogDescription>Importe da marca ou personalize manualmente.</DialogDescription>
          </DialogHeader>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-6">

              {/* ====== LEFT — Upload + Preview ====== */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo || analyzing}
                    className={cn('flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg border-2 border-dashed transition-all',
                      uploadingLogo || analyzing ? 'border-primary/30 bg-primary/5 text-primary cursor-wait' : 'border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary')}>
                    {uploadingLogo || analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="text-[11px] font-medium">Logo da Marca</span>
                    <span className="text-[8px] text-muted-foreground text-center leading-tight">Salva + extrai visual</span>
                  </button>
                  <button onClick={() => kvInputRef.current?.click()} disabled={analyzing}
                    className={cn('flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg border-2 border-dashed transition-all',
                      analyzing ? 'border-primary/30 bg-primary/5 text-primary cursor-wait' : 'border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary')}>
                    {analyzing && !uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    <span className="text-[11px] font-medium">Key Visual</span>
                    <span className="text-[8px] text-muted-foreground text-center leading-tight">Extrai IDV do projeto</span>
                  </button>
                </div>

                {/* Logo preview row */}
                {currentLogoUrl && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#121214] border border-border/50">
                    <img src={currentLogoUrl} alt="Logo" className="w-10 h-10 object-contain rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white font-medium">Logo salva</p>
                      <p className="text-[9px] text-muted-foreground truncate">{currentLogoUrl.split('/').pop()}</p>
                    </div>
                    <button onClick={() => { setLogoUrl(null); if (customTokens) { const r = { ...customTokens }; delete r.logo_url; onCustomTokens(Object.keys(r).length ? r : null); } }}
                      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {brandResult && (
                  <p className={cn('text-[11px] flex items-center gap-1', brandResult.startsWith('Erro') ? 'text-destructive' : 'text-primary')}>
                    <Sparkles className="w-3 h-3 shrink-0" /> {brandResult}
                  </p>
                )}

                {/* LIVE PREVIEW — simula slide real */}
                <div className="rounded-lg overflow-hidden border border-border/50">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider px-3 pt-2 bg-[#0C0C0E]">
                    <Monitor className="w-3 h-3 inline mr-1" />Preview do Slide
                  </p>
                  <div className="aspect-[16/10] p-5 flex flex-col justify-between" style={{ background: currentBgColor }}>
                    {/* Top — logo */}
                    {currentLogoUrl && (
                      <img src={currentLogoUrl} alt="Logo" className="h-6 object-contain self-start mb-2" />
                    )}
                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-base font-bold mb-1" style={{ fontFamily: editFonts?.display || currentDisplayFont, color: editColors?.primary || currentPrimary }}>
                        Titulo da Apresentacao
                      </div>
                      <p className="text-[10px] mb-3" style={{ fontFamily: editFonts?.body || currentBodyFont, color: previewTextMuted }}>
                        Subtitulo com a fonte body e cores do tema ativo.
                      </p>
                      {/* Mini cards */}
                      <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex-1 rounded-md px-2 py-1.5 border"
                            style={{
                              background: `${editColors?.primary || currentPrimary}10`,
                              borderColor: `${editColors?.primary || currentPrimary}25`,
                            }}>
                            <div className="text-[9px] font-bold" style={{ color: editColors?.accent || currentAccent }}>
                              {['128%', '45K', '99.9%'][i - 1]}
                            </div>
                            <div className="text-[7px]" style={{ color: previewTextMuted }}>
                              {['Crescimento', 'Usuarios', 'Uptime'][i - 1]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Bottom bar */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-1">
                        <div className="px-1.5 py-0.5 rounded text-[7px] font-medium text-white" style={{ background: editColors?.primary || currentPrimary }}>
                          Primaria
                        </div>
                        <div className="px-1.5 py-0.5 rounded text-[7px] font-medium"
                          style={{ color: editColors?.accent || currentAccent, border: `1px solid ${editColors?.accent || currentAccent}40` }}>
                          Accent
                        </div>
                      </div>
                      {/* Palette */}
                      <div className="flex gap-0.5">
                        {[
                          adjustColor(editColors?.primary || currentPrimary, -40),
                          editColors?.primary || currentPrimary,
                          adjustColor(editColors?.primary || currentPrimary, 50),
                          editColors?.accent || currentAccent,
                        ].map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
                        ))}
                        <div className="w-3 h-3 rounded-sm border" style={{ background: currentBgColor, borderColor: lightBg ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input type="text" value={saveName} onChange={(e) => setSaveName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                      placeholder="Nome do tema..."
                      className="flex-1 bg-[#121214] border border-border rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary/50 placeholder:text-muted-foreground/50" />
                    <Button onClick={handleSavePreset}
                      disabled={!saveName.trim() || (!customTokens?.colors && !editColors) || saving}
                      className="gap-1 h-7 px-2.5 text-[11px]" size="sm">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Salvar
                    </Button>
                  </div>
                  {customTokens && (
                    <div className="flex items-center justify-between">
                      <button onClick={clearAll} className="text-[10px] text-muted-foreground hover:text-white transition-colors">
                        Limpar
                      </button>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary hover:text-primary"
                        onClick={() => setModalOpen(false)}>
                        <Check className="w-3 h-3 mr-1" /> Usar sem salvar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* ====== RIGHT — Manual editing ====== */}
              <div className="space-y-4">
                {/* Colors */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                    <Palette className="w-3 h-3" /> Cores
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Primary */}
                    <label htmlFor="modal-primary" className="flex items-center gap-2 cursor-pointer">
                      <div className="relative w-8 h-8">
                        <input type="color" id="modal-primary" value={editColors?.primary || currentPrimary}
                          onChange={(e) => handleColorChange('primary', e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-8 h-8 rounded-lg ring-2 ring-white/10 pointer-events-none" style={{ background: editColors?.primary || currentPrimary }} />
                      </div>
                      <div>
                        <p className="text-[10px] text-white font-medium">Primaria</p>
                        <p className="text-[8px] text-muted-foreground font-mono">{editColors?.primary || currentPrimary}</p>
                      </div>
                    </label>
                    {/* Accent */}
                    <label htmlFor="modal-accent" className="flex items-center gap-2 cursor-pointer">
                      <div className="relative w-8 h-8">
                        <input type="color" id="modal-accent" value={editColors?.accent || currentAccent}
                          onChange={(e) => handleColorChange('accent', e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-8 h-8 rounded-lg ring-2 ring-white/10 pointer-events-none" style={{ background: editColors?.accent || currentAccent }} />
                      </div>
                      <div>
                        <p className="text-[10px] text-white font-medium">Accent</p>
                        <p className="text-[8px] text-muted-foreground font-mono">{editColors?.accent || currentAccent}</p>
                      </div>
                    </label>
                    {/* Background */}
                    <label htmlFor="modal-bg" className="flex items-center gap-2 cursor-pointer">
                      <div className="relative w-8 h-8">
                        <input type="color" id="modal-bg" value={currentBgColor}
                          onChange={(e) => handleColorChange('background', e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-8 h-8 rounded-lg ring-2 ring-white/10 pointer-events-none" style={{ background: currentBgColor }} />
                      </div>
                      <div>
                        <p className="text-[10px] text-white font-medium">Fundo</p>
                        <p className="text-[8px] text-muted-foreground font-mono">{currentBgColor}</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Fonts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                    <Type className="w-3 h-3" /> Tipografia
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Display (titulos)</p>
                      <select value={editFonts?.display || currentDisplayFont}
                        onChange={(e) => handleFontChange('display', e.target.value)}
                        className="w-full bg-[#121214] border border-border rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary/50">
                        <optgroup label="Sans-serif">
                          {DISPLAY_FONTS.filter(f => f.cat === 'Sans').map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </optgroup>
                        <optgroup label="Serif">
                          {DISPLAY_FONTS.filter(f => f.cat === 'Serif').map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </optgroup>
                        <optgroup label="Impact / Bold">
                          {DISPLAY_FONTS.filter(f => f.cat === 'Impact').map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Body (corpo)</p>
                      <select value={editFonts?.body || currentBodyFont}
                        onChange={(e) => handleFontChange('body', e.target.value)}
                        className="w-full bg-[#121214] border border-border rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary/50">
                        {BODY_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    {/* Custom Google Font */}
                    <div className="pt-1 border-t border-border/30">
                      <p className="text-[9px] text-muted-foreground mb-1.5">Ou digite qualquer Google Font:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex gap-1">
                          <input type="text" value={customFontDisplay} onChange={(e) => setCustomFontDisplay(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomFont('display', customFontDisplay)}
                            placeholder="Display..."
                            className="flex-1 bg-[#121214] border border-border rounded-md px-2 py-1 text-[10px] text-white outline-none focus:border-primary/50 placeholder:text-muted-foreground/40 min-w-0" />
                          <button onClick={() => handleCustomFont('display', customFontDisplay)} disabled={!customFontDisplay.trim()}
                            className="px-1.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] hover:bg-primary/20 disabled:opacity-30 transition-colors">OK</button>
                        </div>
                        <div className="flex gap-1">
                          <input type="text" value={customFontBody} onChange={(e) => setCustomFontBody(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomFont('body', customFontBody)}
                            placeholder="Body..."
                            className="flex-1 bg-[#121214] border border-border rounded-md px-2 py-1 text-[10px] text-white outline-none focus:border-primary/50 placeholder:text-muted-foreground/40 min-w-0" />
                          <button onClick={() => handleCustomFont('body', customFontBody)} disabled={!customFontBody.trim()}
                            className="px-1.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] hover:bg-primary/20 disabled:opacity-30 transition-colors">OK</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
