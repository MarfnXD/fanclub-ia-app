'use client';

import { useState } from 'react';
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { API_URL } from '@/lib/constants';

interface SlidesPreviewProps {
  fileUrl: string;
  response: string;
}

export function SlidesPreview({ fileUrl, response }: SlidesPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false);

  // Build full URL — fileUrl is like "/files/filename.html"
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API_URL}${fileUrl}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Preview da Apresentação</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? (
              <Minimize2 className="w-4 h-4 mr-1.5" />
            ) : (
              <Maximize2 className="w-4 h-4 mr-1.5" />
            )}
            {fullscreen ? 'Minimizar' : 'Expandir'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(fullUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Abrir editor
          </Button>
        </div>
      </div>

      <Card
        className={`bg-black border-border overflow-hidden transition-all ${
          fullscreen ? 'fixed inset-4 z-50' : 'aspect-video'
        }`}
      >
        <iframe
          src={fullUrl}
          className="w-full h-full border-0"
          title="Slides Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </Card>

      {fullscreen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setFullscreen(false)}
        />
      )}
    </div>
  );
}
