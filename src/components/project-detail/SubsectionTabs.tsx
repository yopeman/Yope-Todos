'use client';

import React, { useState } from 'react';
import type { Section } from '@/types/database';
import { Plus, Trash2, Layers } from 'lucide-react';

interface SubsectionTabsProps {
  subsections: Section[];
  activeSubsectionId: string; // 'default' or a subsection uuid
  canEdit: boolean;
  onSelectSubsection: (subsectionId: string) => void;
  onAddSubsection: (title: string) => Promise<void>;
  onDeleteSubsection: (subsectionId: string) => Promise<void>;
}

export function SubsectionTabs({
  subsections,
  activeSubsectionId,
  canEdit,
  onSelectSubsection,
  onAddSubsection,
  onDeleteSubsection,
}: SubsectionTabsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddSubsection(newTitle.trim());
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="border-b border-border bg-card/50 px-4 sm:px-6">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-2 flex-shrink-0">
          <Layers className="w-3.5 h-3.5" />
          <span>Subsections:</span>
        </div>

        {/* Default Subsection Tab (for tasks not attached to any subsection) */}
        <button
          type="button"
          onClick={() => onSelectSubsection('default')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
            activeSubsectionId === 'default'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>Default</span>
        </button>

        {/* Dynamic Subsections */}
        {subsections.map((sub) => {
          const isActive = activeSubsectionId === sub.id;

          return (
            <div
              key={sub.id}
              className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectSubsection(sub.id)}
                className="truncate max-w-[140px]"
              >
                {sub.title}
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete subsection "${sub.title}" and move its tasks?`)) {
                      onDeleteSubsection(sub.id);
                    }
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition ${
                    isActive ? 'hover:bg-primary-foreground/20' : 'hover:bg-muted-foreground/20'
                  }`}
                  title="Delete subsection"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Subsection inline button/input */}
        {canEdit && (
          <div className="flex-shrink-0">
            {isAdding ? (
              <form onSubmit={handleCreate} className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New tab..."
                  className="px-2.5 py-1 text-xs rounded border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none w-28"
                />
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-2 py-1 text-xs font-bold rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tab</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
