'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Presentation,
  BookOpen,
  Video,
  AudioLines,
  Music,
  CalendarDays,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { SkillInfo } from '@/lib/types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Presentation,
  BookOpen,
  Video,
  AudioLines,
  Music,
  CalendarDays,
};

interface SkillCardProps {
  skill: SkillInfo;
  index: number;
}

export function SkillCard({ skill, index }: SkillCardProps) {
  const Icon = ICONS[skill.icon] || Presentation;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="bg-[#121214] border-border hover:border-primary/50 transition-colors cursor-pointer group">
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-white text-base">{skill.name}</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {skill.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </motion.div>
  );

  if (skill.route) {
    return <Link href={skill.route}>{content}</Link>;
  }

  return content;
}
