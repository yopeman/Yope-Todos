'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TaskStatus, FileAttachment } from '@/types/database';
import { X, Paperclip, Loader2, CheckSquare } from 'lucide-react';

interface AddTaskDialogProps {
  isOpen: boolean;
  canEdit: boolean;
  sectionId: string;
  onClose: () => void;
  onTaskCreated: () => void;
}

export function AddTaskDialog({
  isOpen,
  canEdit,
  sectionId,
  onClose,
  onTaskCreated,
}: AddTaskDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  if (!isOpen || !canEdit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const attachments: FileAttachment[] = [];

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${sectionId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, selectedFile);

        if (uploadError) {
          console.error('File upload failed:', uploadError);
        } else if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(uploadData.path);

          attachments.push({
            name: selectedFile.name,
            url: publicUrlData.publicUrl,
            size: selectedFile.size,
            type: selectedFile.type,
            path: uploadData.path,
          });
        }
      }

      const { error: insertError } = await supabase.from('tasks').insert({
        section_id: sectionId,
        parent_task_id: null,
        title: title.trim(),
        description: description.trim(),
        status,
        attachment_paths: attachments,
        order: 0,
      });

      if (insertError) throw insertError;

      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setStatus('pending');
      onTaskCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Create New Task</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="taskTitle" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              id="taskTitle"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design responsive dashboard layout"
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="taskDescription" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              id="taskDescription"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task details and acceptance criteria..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="taskStatus" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Initial Status
              </label>
              <select
                id="taskStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Attachment (Optional)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs hover:bg-muted transition"
              >
                <span className="truncate max-w-[140px]">
                  {selectedFile ? selectedFile.name : 'Select file...'}
                </span>
                <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
