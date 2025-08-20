
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Badge } from './badge';
import type { Tag } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CollapsibleBadgeListProps {
  tags: string[];
  allTags: Tag[];
  className?: string;
}

export function CollapsibleBadgeList({ tags, allTags, className }: CollapsibleBadgeListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tags.length);

  const calculateVisibleCount = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    let totalWidth = 0;
    let count = 0;

    // Create temporary elements to measure without rendering them
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.display = 'flex';
    tempContainer.style.flexWrap = 'nowrap';
    tempContainer.style.gap = '8px'; // Corresponds to gap-2
    document.body.appendChild(tempContainer);

    const moreBadgeWidth = 50; // Approximate width of the "(+X)" badge

    for (let i = 0; i < tags.length; i++) {
        const tempBadge = document.createElement('span');
        // Rough approximation of badge classes
        tempBadge.className = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold';
        tempBadge.innerText = tags[i];
        tempContainer.appendChild(tempBadge);
        
        const childWidth = tempBadge.offsetWidth;

        if (totalWidth + childWidth + (i < tags.length - 1 ? moreBadgeWidth : 0) > containerWidth) {
            break;
        }
        totalWidth += childWidth + 8; // width + gap
        count++;
    }
    
    document.body.removeChild(tempContainer);
    setVisibleCount(count);

  }, [tags]);


  useEffect(() => {
    // A small delay to ensure the container has its final width after rendering.
    const timer = setTimeout(() => calculateVisibleCount(), 50);

    const resizeObserver = new ResizeObserver(() => {
      const timer = setTimeout(() => calculateVisibleCount(), 50);
      return () => clearTimeout(timer);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [tags, calculateVisibleCount]);

  const hiddenCount = tags.length - visibleCount;

  return (
    <div ref={containerRef} className={cn("flex flex-wrap gap-2 items-center w-full", className)}>
      {tags.slice(0, visibleCount).map((tagName) => {
        const tagInfo = allTags.find(t => t.name === tagName);
        return (
          <Badge
            key={tagName}
            variant="outline"
            className={"text-xs"}
            style={{
              borderColor: tagInfo?.color ?? undefined,
              color: tagInfo?.color ?? undefined,
            }}
          >
            {tagName}
          </Badge>
        );
      })}
      {hiddenCount > 0 && (
        <Badge variant="secondary" className="more-badge text-xs">
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
}
