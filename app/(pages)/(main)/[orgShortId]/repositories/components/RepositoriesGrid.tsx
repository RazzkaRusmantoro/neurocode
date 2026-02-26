'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RepositoryCard from './RepositoryCard';

const STORAGE_KEY_PREFIX = 'neurocode-repo-order';

export type RepoItem = {
  id: string;
  name: string;
  urlName: string;
  url: string;
  source?: 'github' | 'bitbucket' | 'upload';
  description?: string;
  size?: string;
  lastUpdate?: Date | string;
  addedAt: Date | string;
};

interface SortableRepositoryCardProps {
  repo: RepoItem;
  orgShortId: string;
  onBeforeNavigate: () => boolean;
}

function SortableRepositoryCard({ repo, orgShortId, onBeforeNavigate }: SortableRepositoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: repo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`h-full min-h-0 ${isDragging ? 'z-50 opacity-90 scale-105' : ''}`}
      {...attributes}
      {...listeners}
    >
      <RepositoryCard
        id={repo.id}
        name={repo.name}
        urlName={repo.urlName}
        url={repo.url}
        orgShortId={orgShortId}
        source={repo.source}
        addedAt={repo.addedAt}
        description={repo.description}
        size={repo.size}
        lastUpdate={repo.lastUpdate}
        isDraggable
        onBeforeNavigate={onBeforeNavigate}
      />
    </div>
  );
}

interface RepositoriesGridProps {
  repositories: RepoItem[];
  orgShortId: string;
}

function applyStoredOrder(ids: string[], stored: string[]): string[] {
  const set = new Set(ids);
  const ordered: string[] = [];
  for (const id of stored) {
    if (set.has(id)) {
      ordered.push(id);
      set.delete(id);
    }
  }
  for (const id of set) ordered.push(id);
  return ordered;
}

export default function RepositoriesGrid({ repositories, orgShortId }: RepositoriesGridProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}-${orgShortId}`;
  const [justDragged, setJustDragged] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const serverIds = repositories.map((r) => r.id);
  const [orderIds, setOrderIds] = useState<string[]>(serverIds);

  // Only render DndContext after mount to avoid hydration mismatch (dnd-kit generates different IDs on server vs client)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load order from localStorage on mount and when server list changes
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey);
      const order = raw ? (JSON.parse(raw) as string[]) : serverIds;
      setOrderIds(applyStoredOrder(serverIds, order));
    } catch {
      setOrderIds(applyStoredOrder(serverIds, serverIds));
    }
  }, [isMounted, storageKey, serverIds.join(',')]);

  const orderedRepos = orderIds
    .map((id) => repositories.find((r) => r.id === id))
    .filter(Boolean) as RepoItem[];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setJustDragged(true);
      setTimeout(() => setJustDragged(false), 100);
      if (!over || active.id === over.id) return;
      setOrderIds((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [storageKey]
  );

  if (orderedRepos.length === 0) {
    return null;
  }

  const gridClasses = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch';

  // Before mount: render plain grid (no dnd-kit) so server and client HTML match and hydration succeeds
  if (!isMounted) {
    return (
      <div className={gridClasses}>
        {orderedRepos.map((repo) => (
          <div key={repo.id} className="h-full min-h-0">
            <RepositoryCard
              id={repo.id}
              name={repo.name}
              urlName={repo.urlName}
              url={repo.url}
              orgShortId={orgShortId}
              source={repo.source}
              addedAt={repo.addedAt}
              description={repo.description}
              size={repo.size}
              lastUpdate={repo.lastUpdate}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderIds} strategy={rectSortingStrategy}>
        <div className={gridClasses}>
          {orderedRepos.map((repo) => (
            <SortableRepositoryCard
              key={repo.id}
              repo={repo}
              orgShortId={orgShortId}
              onBeforeNavigate={() => !justDragged}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
