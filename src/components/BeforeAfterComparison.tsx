import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Columns2 } from 'lucide-react';

interface BeforeAfterComparisonProps {
  beforePhotos: string[];
  afterPhotos: string[];
  location?: string;
}

export function BeforeAfterComparison({ beforePhotos, afterPhotos, location }: BeforeAfterComparisonProps) {
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(0);

  if (beforePhotos.length === 0 && afterPhotos.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Columns2 className="h-4 w-4" />
          Before / After Comparison
          {location && <Badge variant="outline" className="text-xs">{location}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground text-center">Before</p>
            {beforePhotos.length > 0 ? (
              <div className="relative">
                <div className="aspect-[4/3] border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={beforePhotos[beforeIndex]}
                    alt={`Before photo ${beforeIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {beforePhotos.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setBeforeIndex(i => Math.max(0, i - 1))}
                      disabled={beforeIndex === 0}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {beforeIndex + 1} / {beforePhotos.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setBeforeIndex(i => Math.min(beforePhotos.length - 1, i + 1))}
                      disabled={beforeIndex === beforePhotos.length - 1}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
                <p className="text-sm text-muted-foreground">No before photos</p>
              </div>
            )}
          </div>

          {/* After */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground text-center">After (Damage)</p>
            {afterPhotos.length > 0 ? (
              <div className="relative">
                <div className="aspect-[4/3] border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={afterPhotos[afterIndex]}
                    alt={`After photo ${afterIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {afterPhotos.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setAfterIndex(i => Math.max(0, i - 1))}
                      disabled={afterIndex === 0}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {afterIndex + 1} / {afterPhotos.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setAfterIndex(i => Math.min(afterPhotos.length - 1, i + 1))}
                      disabled={afterIndex === afterPhotos.length - 1}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
                <p className="text-sm text-muted-foreground">No damage photos</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
