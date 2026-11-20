'use client';

import React, { useState } from 'react';
import type { Task, TaskStatus } from '@/types/database';
import { TaskItem } from './TaskItem';
import { Plus, CheckSquare, Search } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  canEdit: boolean;
  onOpenAddTask: () => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddSubtask: (parentTaskId: string, title: string) => Promise<void>;
  onUpdateSubtaskStatus: (subtaskId: string, status: TaskStatus) => Promise<void>;
  onDeleteSubtask: (subtaskId: string) => Promise<void>;
  onOpenComments: (task: Task) => void;
}

export function TaskList({
  tasks,
  canEdit,
  onOpenAddTask,
  onUpdateStatus,
  onDeleteTask,
  onAddSubtask,
  onUpdateSubtaskStatus,
  onDeleteSubtask,
  onOpenComments,
}: TaskListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');

  const filteredTasks = tasks.filter((t) => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        {/* Filter Badges & Add Task */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition ${
                filter === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-1 rounded-md transition ${
                filter === 'pending' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setFilter('in_progress')}
              className={`px-2.5 py-1 rounded-md transition ${
                filter === 'in_progress' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-2.5 py-1 rounded-md transition ${
                filter === 'completed' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Done
            </button>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={onOpenAddTask}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Task List items */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-card/40">
          <CheckSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
          <h4 className="text-sm font-semibold text-foreground">No tasks found</h4>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {tasks.length === 0
              ? 'This subsection currently has no tasks.'
              : 'No tasks match the active filter or search query.'}
          </p>
          {canEdit && tasks.length === 0 && (
            <button
              type="button"
              onClick={onOpenAddTask}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              canEdit={canEdit}
              onUpdateStatus={onUpdateStatus}
              onDeleteTask={onDeleteTask}
              onAddSubtask={onAddSubtask}
              onUpdateSubtaskStatus={onUpdateSubtaskStatus}
              onDeleteSubtask={onDeleteSubtask}
              onOpenComments={onOpenComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
