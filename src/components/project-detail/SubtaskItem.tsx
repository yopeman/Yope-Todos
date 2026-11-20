'use client';

import React from 'react';
import type { Task, TaskStatus } from '@/types/database';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  MessageSquare,
} from 'lucide-react';

interface SubtaskItemProps {
  subtask: Task;
  canEdit: boolean;
  onUpdateStatus: (subtaskId: string, status: TaskStatus) => Promise<void>;
  onDeleteSubtask: (subtaskId: string) => Promise<void>;
  onOpenComments: (task: Task) => void;
}

export function SubtaskItem({
  subtask,
  canEdit,
  onUpdateStatus,
  onDeleteSubtask,
  onOpenComments,
}: SubtaskItemProps) {
  const getNextStatus = (current: TaskStatus): TaskStatus => {
    if (current === 'pending') return 'in_progress';
    if (current === 'in_progress') return 'completed';
    return 'pending';
  };

  const renderStatusButton = () => {
    switch (subtask.status) {
      case 'completed':
        return (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => onUpdateStatus(subtask.id, getNextStatus(subtask.status))}
            className="text-emerald-500 hover:text-emerald-600 transition"
            title="Completed (Click to change status)"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        );
      case 'in_progress':
        return (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => onUpdateStatus(subtask.id, getNextStatus(subtask.status))}
            className="text-blue-500 hover:text-blue-600 transition"
            title="In Progress (Click to change status)"
          >
            <Clock className="w-4 h-4 animate-pulse" />
          </button>
        );
      case 'pending':
      default:
        return (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => onUpdateStatus(subtask.id, getNextStatus(subtask.status))}
            className="text-muted-foreground hover:text-foreground transition"
            title="Pending (Click to start)"
          >
            <Circle className="w-4 h-4" />
          </button>
        );
    }
  };

  return (
    <div className="group flex items-center justify-between py-2 px-3 rounded-lg bg-card/60 hover:bg-muted/40 border border-border/50 text-xs transition">
      <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
        {renderStatusButton()}

        <span
          className={`truncate font-medium ${
            subtask.status === 'completed'
              ? 'line-through text-muted-foreground'
              : 'text-foreground'
          }`}
        >
          {subtask.title}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Comment count button */}
        <button
          type="button"
          onClick={() => onOpenComments(subtask)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition px-1.5 py-0.5 rounded hover:bg-muted"
          title="Open comments"
        >
          <MessageSquare className="w-3 h-3" />
          <span>{subtask.comments_count || 0}</span>
        </button>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete subtask "${subtask.title}"?`)) {
                onDeleteSubtask(subtask.id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition p-0.5"
            title="Delete subtask"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
