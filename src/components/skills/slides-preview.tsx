'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Maximize2, Minimize2, ExternalLink,
  ImagePlus, PlusSquare, EyeOff, LayoutGrid,
  RotateCcw, Save, FileDown, Play,
  ChevronLeft, ChevronRight, Paintbrush, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/constants';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';

interface SlidesPreviewProps {
  fileUrl: string;
  response: string;
  onRetheme?: () => void;
  isRetheming?: boolean;
}

type SlideCommand =
  | 'insertImage' | 'addSlide' | 'toggleHide' | 'toggleSidebar'
  | 'reset' | 'save' | 'pdf' | 'present' | 'prev' | 'next';

const TOOLBAR_ITEMS: { command: SlideCommand; icon: React.ElementType; label: string; accent?: boolean }[] = [
  { command: 'insertImage', icon: ImagePlus, label: 'Inserir imagem' },
  { command: 'addSlide', icon: PlusSquare, label: 'Adicionar slide' },
  { command: 'toggleHide', icon: EyeOff, label: 'Ocultar/Mostrar slide (H)' },
  { command: 'toggleSidebar', icon: LayoutGrid, label: 'Painel de slides (S)' },
  { command: 'reset', icon: RotateCcw, label: 'Resetar edicoes' },
  { command: 'save', icon: Save, label: 'Salvar HTML' },
  { command: 'pdf', icon: FileDown, label: 'Exportar PDF' },
  { command: 'present', icon: Play, label: 'Apresentar', accent: true },
];

export function SlidesPreview({ fileUrl, response, onRetheme, isRetheming }: SlidesPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API_URL}${fileUrl}`;

  const handleImageSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      iframeRef.current?.contentWindow?.postMessage({ command: 'insertImageData', dataUrl }, '*');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const sendCommand = useCallback((command: SlideCommand) => {
    // Insert image: open file picker in parent (avoids iframe user-gesture restriction)
    if (command === 'insertImage') {
      imageInputRef.current?.click();
      return;
    }
    // These need to open in new tab (fullscreen/print don't work in iframe)
    if (command === 'pdf' || command === 'present') {
      window.open(fullUrl, '_blank');
      return;
    }
    // Save triggers download — also better in new tab
    if (command === 'save') {
      window.open(fullUrl, '_blank');
      return;
    }
    // Reset reloads iframe
    if (command === 'reset') {
      if (iframeRef.current) {
        iframeRef.current.src = fullUrl;
      }
      return;
    }
    iframeRef.current?.contentWindow?.postMessage({ command }, '*');
  }, [fullUrl]);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-[#0F0F11]">
          <div className="flex items-center gap-1">
            {/* Nav arrows */}
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => sendCommand('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => sendCommand('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Action buttons */}
            {TOOLBAR_ITEMS.map(({ command, icon: Icon, label, accent }) => (
              <Tooltip key={command} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-7 w-7',
                      accent && 'text-primary hover:text-primary hover:bg-primary/10'
                    )}
                    onClick={() => sendCommand(command)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  <span className="text-xs">{label}</span>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {onRetheme && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={onRetheme}
                    disabled={isRetheming}
                  >
                    {isRetheming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paintbrush className="w-3.5 h-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  <span className="text-xs">Aplicar tema atual</span>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => setFullscreen(!fullscreen)}
                >
                  {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                <span className="text-xs">{fullscreen ? 'Minimizar' : 'Expandir'}</span>
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => window.open(fullUrl, '_blank')}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                <span className="text-xs">Abrir em nova aba</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Hidden file input for image insertion */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelected}
        />

        {/* Iframe */}
        <Card
          className={cn(
            'bg-black border-0 rounded-none overflow-hidden flex-1',
            fullscreen && 'fixed inset-4 z-50 rounded-lg border border-border'
          )}
        >
          <iframe
            ref={iframeRef}
            src={fullUrl}
            className="w-full h-full border-0"
            title="Slides Preview"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
          />
        </Card>

        {fullscreen && (
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setFullscreen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
