'use client';

import { useState, useCallback } from 'react';
import {
  GripVertical, Trash2, Plus, ChevronDown, ChevronUp, Loader2,
  Layout, BarChart3, List, Columns2, GitBranch, Quote, Table, CheckSquare, Image, Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SlidesPlan, SlidesPlanSlide } from '@/lib/types';

const CONTENT_TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  cover: { label: 'Capa', icon: Layout, color: 'text-purple-400' },
  bullets: { label: 'Bullets', icon: List, color: 'text-blue-400' },
  narrative: { label: 'Narrativa', icon: Type, color: 'text-gray-400' },
  stats: { label: 'Dados', icon: BarChart3, color: 'text-emerald-400' },
  comparison: { label: 'Comparacao', icon: Columns2, color: 'text-amber-400' },
  process: { label: 'Processo', icon: GitBranch, color: 'text-cyan-400' },
  quote: { label: 'Citacao', icon: Quote, color: 'text-pink-400' },
  checklist: { label: 'Checklist', icon: CheckSquare, color: 'text-green-400' },
  table_data: { label: 'Tabela', icon: Table, color: 'text-orange-400' },
  end: { label: 'Encerramento', icon: Layout, color: 'text-purple-400' },
};

const COMPONENT_LABELS: Record<string, string> = {
  'slide--cover': 'Cover',
  'stat-grid': 'Stat Grid',
  'feature-list': 'Feature List',
  'card-grid-2': 'Card Grid (2 col)',
  'card-grid-3': 'Card Grid (3 col)',
  'split-layout': 'Split Layout',
  'timeline': 'Timeline',
  'checklist': 'Checklist',
  'quote-block': 'Quote Block',
  'table': 'Tabela',
  'pricing-cards': 'Pricing Cards',
  'info-box': 'Info Box',
  'slide--end': 'Encerramento',
};

interface SlidePlanEditorProps {
  plan: SlidesPlan;
  pipelineStep: 1 | 2;
  isLoading?: boolean;
  onChange: (plan: SlidesPlan) => void;
  onApprove: () => void;
}

function SlideCard({
  slide,
  pipelineStep,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  slide: SlidesPlanSlide;
  pipelineStep: 1 | 2;
  onUpdate: (slide: SlidesPlanSlide) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingContent, setEditingContent] = useState<number | null>(null);

  const meta = CONTENT_TYPE_META[slide.content_type] || CONTENT_TYPE_META.narrative;
  const TypeIcon = meta.icon;

  const isCoverOrEnd = slide.type === 'cover' || slide.type === 'end';

  return (
    <div className={cn(
      'border border-border rounded-lg bg-[#121214] overflow-hidden transition-colors',
      'hover:border-primary/20',
    )}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={isFirst}
            className="p-0.5 hover:text-white disabled:opacity-20 transition-opacity"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={isLast}
            className="p-0.5 hover:text-white disabled:opacity-20 transition-opacity"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <span className="text-[10px] text-muted-foreground font-mono w-5 shrink-0">
          {String(slide.number).padStart(2, '0')}
        </span>

        <TypeIcon className={cn('w-3.5 h-3.5 shrink-0', meta.color)} />
        <span className={cn('text-[10px] uppercase tracking-wider shrink-0', meta.color)}>
          {meta.label}
        </span>

        {slide.label && (
          <span className="text-[10px] text-muted-foreground">
            {slide.label}
          </span>
        )}

        <span className="flex-1 text-sm text-white truncate ml-1">
          {slide.title}
        </span>

        {/* Step 2: show component badge */}
        {pipelineStep === 2 && slide.component && (
          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono shrink-0">
            {COMPONENT_LABELS[slide.component] || slide.component}
          </span>
        )}

        {!isCoverOrEnd && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive text-muted-foreground transition-opacity"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}

        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
          {/* Title (editable) */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Titulo</label>
            {editingTitle ? (
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onUpdate({ ...slide, title: e.target.value })}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                autoFocus
                className="w-full bg-[#0A0A0B] border border-border rounded px-2 py-1 text-sm text-white focus:border-primary focus:outline-none"
              />
            ) : (
              <p
                className="text-sm text-white cursor-text hover:bg-[#0A0A0B] rounded px-2 py-1 transition-colors"
                onClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
              >
                {slide.title || <span className="text-muted-foreground italic">Clique para editar</span>}
              </p>
            )}
          </div>

          {/* Label (editable) */}
          {!isCoverOrEnd && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Label / Secao</label>
              <input
                type="text"
                value={slide.label || ''}
                onChange={(e) => onUpdate({ ...slide, label: e.target.value || null })}
                placeholder="Ex: Diagnostico, Oportunidade..."
                className="w-full bg-[#0A0A0B] border border-border rounded px-2 py-1 text-xs text-white focus:border-primary focus:outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          )}

          {/* Content items (editable) */}
          {slide.content.length > 0 && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Conteudo ({slide.content.length} itens)</label>
              <div className="space-y-1 mt-1">
                {slide.content.map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5 group/item">
                    <GripVertical className="w-3 h-3 text-muted-foreground/30 mt-1.5 shrink-0" />
                    {editingContent === i ? (
                      <textarea
                        value={item}
                        onChange={(e) => {
                          const newContent = [...slide.content];
                          newContent[i] = e.target.value;
                          onUpdate({ ...slide, content: newContent });
                        }}
                        onBlur={() => setEditingContent(null)}
                        autoFocus
                        rows={2}
                        className="flex-1 bg-[#0A0A0B] border border-border rounded px-2 py-1 text-xs text-white focus:border-primary focus:outline-none resize-none"
                      />
                    ) : (
                      <p
                        className="flex-1 text-xs text-muted-foreground cursor-text hover:bg-[#0A0A0B] rounded px-2 py-1 transition-colors leading-relaxed"
                        onClick={() => setEditingContent(i)}
                      >
                        {item}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        const newContent = slide.content.filter((_, j) => j !== i);
                        onUpdate({ ...slide, content: newContent });
                      }}
                      className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:text-destructive text-muted-foreground transition-opacity mt-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onUpdate({ ...slide, content: [...slide.content, ''] })}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary mt-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Adicionar item
              </button>
            </div>
          )}

          {/* Step 2: Component + design info (read-only display) */}
          {pipelineStep === 2 && slide.component && (
            <div className="flex flex-wrap gap-2 pt-1">
              {slide.icons && slide.icons.length > 0 && (
                <div className="text-[10px] text-muted-foreground">
                  Icones: {slide.icons.join(', ')}
                </div>
              )}
              {slide.design_notes && (
                <div className="text-[10px] text-muted-foreground italic w-full">
                  {slide.design_notes}
                </div>
              )}
            </div>
          )}

          {/* Notes (architect reasoning) */}
          {slide.notes && (
            <div className="text-[10px] text-muted-foreground/60 italic pt-1 border-t border-border/50">
              {slide.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SlidePlanEditor({ plan, pipelineStep, isLoading, onChange, onApprove }: SlidePlanEditorProps) {
  const updateSlide = useCallback((index: number, updated: SlidesPlanSlide) => {
    const newSlides = [...plan.slides];
    newSlides[index] = updated;
    onChange({ ...plan, slides: newSlides, meta: { ...plan.meta, total_slides: newSlides.length } });
  }, [plan, onChange]);

  const deleteSlide = useCallback((index: number) => {
    const newSlides = plan.slides.filter((_, i) => i !== index);
    // Renumber
    newSlides.forEach((s, i) => { s.number = i + 1; });
    onChange({ ...plan, slides: newSlides, meta: { ...plan.meta, total_slides: newSlides.length } });
  }, [plan, onChange]);

  const moveSlide = useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= plan.slides.length) return;
    const newSlides = [...plan.slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    // Renumber
    newSlides.forEach((s, i) => { s.number = i + 1; });
    onChange({ ...plan, slides: newSlides });
  }, [plan, onChange]);

  const addSlide = useCallback(() => {
    const lastContent = plan.slides.findLastIndex(s => s.type === 'content');
    const insertAt = lastContent >= 0 ? lastContent + 1 : plan.slides.length - 1;
    const newSlide: SlidesPlanSlide = {
      number: insertAt + 1,
      type: 'content',
      label: null,
      title: 'Novo slide',
      subtitle: null,
      content: [''],
      content_type: 'bullets',
      notes: 'Adicionado manualmente',
    };
    const newSlides = [...plan.slides];
    newSlides.splice(insertAt, 0, newSlide);
    newSlides.forEach((s, i) => { s.number = i + 1; });
    onChange({ ...plan, slides: newSlides, meta: { ...plan.meta, total_slides: newSlides.length } });
  }, [plan, onChange]);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">{plan.meta.title}</h2>
            <p className="text-[10px] text-muted-foreground">{plan.meta.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">
              {plan.meta.total_slides} slides
            </span>
            <span className={cn(
              'text-[10px] px-2 py-0.5 rounded',
              plan.meta.curation_mode
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-emerald-500/10 text-emerald-400'
            )}>
              {plan.meta.curation_mode ? 'Curadoria ON' : 'Conteudo preservado'}
            </span>
          </div>
        </div>
        {plan.meta.curation_notes && (
          <p className="text-[10px] text-muted-foreground mt-1">{plan.meta.curation_notes}</p>
        )}
      </div>

      {/* Slides list */}
      <div className="flex-1 overflow-auto min-h-0 px-4 py-3 space-y-2">
        {plan.slides.map((slide, index) => (
          <SlideCard
            key={`${slide.number}-${index}`}
            slide={slide}
            pipelineStep={pipelineStep}
            onUpdate={(updated) => updateSlide(index, updated)}
            onDelete={() => deleteSlide(index)}
            onMoveUp={() => moveSlide(index, -1)}
            onMoveDown={() => moveSlide(index, 1)}
            isFirst={index === 0}
            isLast={index === plan.slides.length - 1}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-border bg-[#0A0A0B] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-white gap-1"
              onClick={addSlide}
            >
              <Plus className="w-3 h-3" /> Adicionar slide
            </Button>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {pipelineStep === 1
                ? 'Step 1/3 — Revise e aprove para definir componentes'
                : 'Step 2/3 — Aprove para gerar HTML'}
            </span>
          </div>
          <Button
            onClick={onApprove}
            disabled={isLoading}
            className="gap-1.5 bg-primary hover:bg-primary/90 text-sm h-8 px-4"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            {pipelineStep === 1 ? 'Aprovar plano' : 'Gerar slides'}
          </Button>
        </div>
      </div>
    </div>
  );
}
