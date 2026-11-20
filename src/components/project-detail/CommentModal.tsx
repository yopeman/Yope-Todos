'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task, Comment, FileAttachment } from '@/types/database';
import {
  X,
  MessageSquare,
  Send,
  Paperclip,
  Trash2,
  Loader2,
  FileText,
  User,
} from 'lucide-react';

interface CommentModalProps {
  task: Task | null;
  canComment: boolean;
  onClose: () => void;
  onCommentsUpdated: () => void;
}

export function CommentModal({
  task,
  canComment,
  onClose,
  onCommentsUpdated,
}: CommentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

  const loadComments = useCallback(async () => {
    if (!task) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', task.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Fetch author profiles for all unique author IDs
      const authorIds = Array.from(new Set(data.map((c: Comment) => c.auth_user_id)));
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', authorIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
        const enrichedComments = data.map((c: Comment) => ({
          ...c,
          author: profileMap.get(c.auth_user_id) || null,
        }));
        setComments(enrichedComments);
      } else {
        setComments(data);
      }
    }
    setLoading(false);
  }, [task, supabase]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (task && dialog) {
      if (!dialog.open) {
        dialog.showModal();
      }
      loadComments();
    } else if (dialog && dialog.open) {
      dialog.close();
    }
  }, [task, loadComments]);

  // Modern Web Guidance: fallback for click-outside dismissal
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    let pressedOutside = false;
    const isOutside = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      return (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      );
    };

    const handlePointerDown = (e: MouseEvent) => {
      pressedOutside = isOutside(e);
    };

    const handlePointerUp = (e: MouseEvent) => {
      if (pressedOutside && isOutside(e)) {
        onClose();
      }
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);

    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [onClose]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim() || !canComment || submitting) return;

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be signed in to post comments.');
        return;
      }

      const attachments: FileAttachment[] = [];

      // If user attached a file, upload to Supabase Storage
      if (selectedFile) {
        setUploadProgress(true);
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${task.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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

      const { error } = await supabase.from('comments').insert({
        task_id: task.id,
        auth_user_id: user.id,
        comment: newComment.trim(),
        attachment_paths: attachments,
      });

      if (error) throw error;

      setNewComment('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadComments();
      onCommentsUpdated();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error posting comment');
    } finally {
      setSubmitting(false);
      setUploadProgress(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentsUpdated();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting comment');
    }
  };

  if (!task) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="comment-modal-title"
      className="p-0 rounded-2xl border border-border bg-card text-foreground shadow-2xl w-full max-w-xl backdrop:bg-black/60 backdrop:backdrop-blur-sm m-auto overflow-hidden"
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 id="comment-modal-title" className="text-base font-bold text-foreground line-clamp-1">
                {task.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                Task Discussion & Attachments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No comments yet</p>
              <p className="text-xs mt-1">Start the conversation below.</p>
            </div>
          ) : (
            comments.map((c) => {
              const isOwner = currentUserId === c.auth_user_id;
              const authorName = c.author?.name || c.author?.email?.split('@')[0] || 'Team member';
              const formattedDate = new Date(c.created_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={c.id} className="group flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs flex-shrink-0 border border-border">
                    {authorName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 rounded-xl p-3.5 bg-muted/40 border border-border/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{authorName}</span>
                        <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
                      </div>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition p-1"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {c.comment}
                    </p>

                    {/* Attachments */}
                    {c.attachment_paths && c.attachment_paths.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {c.attachment_paths.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-card border border-border text-primary hover:underline shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="max-w-[160px] truncate">{att.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Post Form */}
        <div className="p-4 border-t border-border bg-card">
          {canComment ? (
            <form onSubmit={handlePostComment} className="space-y-3">
              {selectedFile && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted text-xs border border-border">
                  <span className="flex items-center gap-1.5 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-primary" />
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
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
                  title="Attach file"
                  className="p-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3.5 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                />

                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition shadow-sm"
                >
                  {submitting || uploadProgress ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {uploadProgress ? 'Uploading...' : 'Send'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-2 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>You must be signed in with commenting permissions to participate.</span>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
