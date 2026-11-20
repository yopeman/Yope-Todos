'use client';

import React, { useState } from 'react';
import type { Task, TaskStatus } from '@/types/database';
import { SubtaskItem } from './SubtaskItem';
import {
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Paperclip,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  canEdit: boolean;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddSubtask: (parentTaskId: string, title: string) => Promise<void>;
  onUpdateSubtaskStatus: (subtaskId: string, status: TaskStatus) => Promise<void>;
  onDeleteSubtask: (subtaskId: string) => Promise<void>;
  onOpenComments: (task: Task) => void;
}

export function TaskItem({
  task,
  canEdit,
  onUpdateStatus,
  onDeleteTask,
  onAddSubtask,
  onUpdateSubtaskStatus,
  onDeleteSubtask,
  onOpenComments,
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.status === 'completed').length;

  const getNextStatus = (current: TaskStatus): TaskStatus => {
    if (current === 'pending') return 'in_progress';
    if (current === 'in_progress') return 'completed';
    return 'pending';
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    await onAddSubtask(task.id, subtaskTitle.trim());
    setSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  const renderStatusButton = () => {
    switch (task.status) {
      case 'completed':
        return (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => onUpdateStatus(task.id, getNextStatus(task.status))}
            className="text-emerald-500 hover:text-emerald-600 transition flex-shrink-0"
            title="Completed (Click to change status)"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        );
      case 'in_progress':
        return (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => onUpdateStatus(task.id, getNextStatus(task.status))}
            className="text-blue-500 hover:text-blue-600 transition flex-shrink-0"
            title="In Progress (Click to change status)"
          >
            <Clock className="w-5 h-5 animate-pulse" />
          </button>
        );
      case 'pending':
      default:
        return (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => onUpdateStatus(task.id, getNextStatus(task.status))}
            className="text-muted-foreground hover:text-foreground transition flex-shrink-0"
            title="Pending (Click to start)"
          >
            <Circle className="w-5 h-5" />
          </button>
        );
    }
  };

  return (
    <div className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 shadow-sm space-y-3">
      {/* Main Task Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="pt-0.5">{renderStatusButton()}</div>

          <div className="flex-1 min-w-0">
            <h4
              className={`text-sm font-semibold transition ${
                task.status === 'completed'
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground'
              }`}
            >
              {task.title}
            </h4>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          {/* Attachments Indicator */}
          {task.attachment_paths && task.attachment_paths.length > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted"
              title={`${task.attachment_paths.length} file(s) attached`}
            >
              <Paperclip className="w-3 h-3" />
              <span>{task.attachment_paths.length}</span>
            </span>
          )}

          {/* Comment Count Badge (Click to open modal) */}
          <button
            type="button"
            onClick={() => onOpenComments(task)}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition shadow-xs"
            title="View discussion & comments"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{task.comments_count || 0}</span>
          </button>

          {/* Delete Task */}
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete task "${task.title}" and its subtasks?`)) {
                  onDeleteTask(task.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Subtasks Accordion & Counter */}
      <div className="pt-2 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 font-semibold hover:text-foreground transition"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>
              Subtasks ({completedSubtasks}/{subtasks.length})
            </span>
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setIsExpanded(true);
                setIsAddingSubtask(true);
              }}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <Plus className="w-3 h-3" />
              <span>Add Subtask</span>
            </button>
          )}
        </div>

        {/* Indented Subtask List */}
        {isExpanded && (
          <div className="ml-4 pl-3 border-l-2 border-muted space-y-1.5 mt-2">
            {subtasks.map((sub) => (
              <SubtaskItem
                key={sub.id}
                subtask={sub}
                canEdit={canEdit}
                onUpdateStatus={onUpdateSubtaskStatus}
                onDeleteSubtask={onDeleteSubtask}
                onOpenComments={onOpenComments}
              />
            ))}

            {isAddingSubtask && (
              <form onSubmit={handleCreateSubtask} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  autoFocus
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="New subtask title..."
                  className="flex-1 px-2.5 py-1.5 text-xs rounded border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!subtaskTitle.trim()}
                  className="px-2.5 py-1.5 rounded bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSubtask(false)}
                  className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </form>
            )}

            {subtasks.length === 0 && !isAddingSubtask && (
              <p className="text-[11px] text-muted-foreground italic py-1">
                No subtasks yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
