'use client';

import React, { useState } from 'react';
import type { Section } from '@/types/database';
import {
  Folder,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';

interface SectionSidebarProps {
  sections: Section[];
  activeSectionId: string | null;
  canEdit: boolean;
  onSelectSection: (sectionId: string) => void;
  onAddSection: (title: string) => Promise<void>;
  onRenameSection: (sectionId: string, newTitle: string) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function SectionSidebar({
  sections,
  activeSectionId,
  canEdit,
  onSelectSection,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  isOpenMobile,
  onCloseMobile,
}: SectionSidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddSection(newTitle.trim());
    setNewTitle('');
    setIsAdding(false);
  };

  const handleRename = async (sectionId: string) => {
    if (!editTitle.trim()) return;
    await onRenameSection(sectionId, editTitle.trim());
    setEditingId(null);
  };

  const content = (
    <div className="flex flex-col h-full bg-card border-r border-border w-72">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Sections
          </h2>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            title="Add Section"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add Section Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-3 border-b border-border bg-muted/40">
          <input
            type="text"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Section title..."
            className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none mb-2"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 rounded text-muted-foreground hover:text-foreground text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-2.5 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Sections List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {sections.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground italic">
            No sections yet.
          </div>
        ) : (
          sections.map((sec) => {
            const isActive = activeSectionId === sec.id;
            const isEditing = editingId === sec.id;

            if (isEditing) {
              return (
                <div key={sec.id} className="p-2 rounded-lg bg-muted border border-border flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs rounded border border-border bg-background text-foreground focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRename(sec.id)}
                    className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="p-1 text-muted-foreground hover:bg-muted rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={sec.id}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
                onClick={() => {
                  onSelectSection(sec.id);
                  onCloseMobile();
                }}
              >
                <div className="flex items-center gap-2 truncate flex-1 mr-2">
                  <Folder className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{sec.title}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(sec.id);
                          setEditTitle(sec.title);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-background rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete section "${sec.title}" and its tasks?`)) {
                            onDeleteSection(sec.id);
                          }
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-background rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            );
          })
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-card shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
