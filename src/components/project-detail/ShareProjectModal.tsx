'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project, Invitation, LinkSharePermission, InvitationPermission } from '@/types/database';
import {
  X,
  Share2,
  Copy,
  Check,
  UserPlus,
  Mail,
  Trash2,
  Loader2,
  Globe,
} from 'lucide-react';

interface ShareProjectModalProps {
  project: Project;
  isOpen: boolean;
  canManageShare: boolean;
  onClose: () => void;
  onProjectUpdated: (updatedProject: Project) => void;
}

export function ShareProjectModal({
  project,
  isOpen,
  canManageShare,
  onClose,
  onProjectUpdated,
}: ShareProjectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [linkPerm, setLinkPerm] = useState<LinkSharePermission>(project.link_share_permission);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePerm, setInvitePerm] = useState<InvitationPermission>('view');
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('project_id', project.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (data) setInvitations(data);
    setLoading(false);
  }, [project.id, supabase]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog) {
      if (!dialog.open) dialog.showModal();
      loadInvitations();
    } else if (dialog && dialog.open) {
      dialog.close();
    }
  }, [isOpen, loadInvitations]);

  const handleUpdateLinkPerm = async (newPerm: LinkSharePermission) => {
    setLinkPerm(newPerm);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ link_share_permission: newPerm, updated_at: new Date().toISOString() })
        .eq('id', project.id)
        .select()
        .single();

      if (error) throw error;
      if (data) onProjectUpdated(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating link permission');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || inviting) return;

    setInviting(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          project_id: project.id,
          email: inviteEmail.trim().toLowerCase(),
          permission: invitePerm,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setInvitations((prev) => [data, ...prev]);
        setInviteEmail('');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error sending invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', inviteId);

      if (error) throw error;
      setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error revoking invitation');
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="share-modal-title"
      className="p-0 rounded-2xl border border-border bg-card text-foreground shadow-2xl w-full max-w-lg backdrop:bg-black/60 backdrop:backdrop-blur-sm m-auto overflow-hidden"
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="share-modal-title" className="text-base font-bold text-foreground">
                Share & Collaboration
              </h3>
              <p className="text-xs text-muted-foreground">{project.title}</p>
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

        <div className="p-6 space-y-6 overflow-y-auto overscroll-contain">
          {/* Public Link Share Setting */}
          <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <Globe className="w-4 h-4 text-primary" />
              <span>Public Link Sharing</span>
            </div>

            {canManageShare ? (
              <div className="space-y-2">
                <select
                  value={linkPerm}
                  onChange={(e) => handleUpdateLinkPerm(e.target.value as LinkSharePermission)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="block">Blocked - Only invited members</option>
                  <option value="view">View - Anyone with link can view</option>
                  <option value="comment">Comment - Anyone with link can comment (after login)</option>
                  <option value="edit">Edit - Anyone with link can edit (after login)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Guests without an account can view if sharing is active, but must sign in to comment or edit.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground capitalize">
                Current link setting: <span className="font-semibold text-foreground">{linkPerm}</span>
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-semibold hover:bg-muted transition shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Project Link'}</span>
              </button>
            </div>
          </div>

          {/* Invite Collaborator by Email */}
          {canManageShare && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Invite by Email</span>
              </div>

              <form onSubmit={handleSendInvite} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <select
                  value={invitePerm}
                  onChange={(e) => setInvitePerm(e.target.value as InvitationPermission)}
                  className="px-2.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="view">View</option>
                  <option value="comment">Comment</option>
                  <option value="edit">Edit</option>
                </select>

                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
                >
                  {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Invite'}
                </button>
              </form>
            </div>
          )}

          {/* Invited Members List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Team Members & Invitations ({invitations.length})
            </h4>

            {loading ? (
              <div className="py-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No invitations sent yet.</p>
            ) : (
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{inv.email}</span>
                      <div className="flex items-center gap-2 text-muted-foreground text-[11px] mt-0.5">
                        <span className="capitalize font-medium text-primary">{inv.permission}</span>
                        <span>•</span>
                        <span
                          className={`font-medium ${
                            inv.status === 'accepted'
                              ? 'text-emerald-500'
                              : inv.status === 'declined'
                              ? 'text-destructive'
                              : 'text-amber-500'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>

                    {canManageShare && (
                      <button
                        type="button"
                        onClick={() => handleDeleteInvite(inv.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition"
                        title="Revoke invitation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
