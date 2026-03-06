import type { SkillInfo } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-backend-production-f055.up.railway.app';

export const MAX_CONVERSATIONS = 50;

export const SKILLS: SkillInfo[] = [
  {
    id: 'slides',
    name: 'Slides',
    description: 'Apresentações HTML profissionais',
    icon: 'Presentation',
    route: '/skills/slides',
  },
  {
    id: 'roteiro',
    name: 'Roteiro',
    description: 'Storytelling, personagens, narrativa (Save the Cat)',
    icon: 'BookOpen',
  },
  {
    id: 'kling',
    name: 'Kling',
    description: 'Prompts de vídeo IA',
    icon: 'Video',
  },
  {
    id: 'sfx',
    name: 'SFX',
    description: 'Sound design e efeitos sonoros',
    icon: 'AudioLines',
  },
  {
    id: 'suno',
    name: 'Suno',
    description: 'Composição musical e trilhas',
    icon: 'Music',
  },
  {
    id: 'cronograma',
    name: 'Cronograma',
    description: 'Cronogramas de produção',
    icon: 'CalendarDays',
  },
];

export const LEVEL_LABELS: Record<string, string> = {
  massa: 'Massa',
  power: 'Power',
  admin: 'Admin',
};
