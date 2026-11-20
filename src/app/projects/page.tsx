'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import type { Project, Invitation, LinkSharePermission } from '@/types/database';
import {
  FolderGit2,
  Plus,
  Mail,
  Check,
  X,
  Share2,
  Trash2,
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  Users,
} from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSharePerm, setNewSharePerm] = useState<LinkSharePermission>('block');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setCurrentUser({ id: user.id, email: user.email || '' });

    // 1. Fetch Owned Projects
    const { data: owned } = await supabase
      .from('projects')
      .select('*')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (owned) setOwnedProjects(owned);

    // 2. Fetch Pending Invitations for this user's email
    if (user.email) {
      const { data: invites } = await supabase
        .from('invitations')
        .select('*, project:projects(*)')
        .ilike('email', user.email)
        .eq('status', 'pending')
        .is('deleted_at', null);

      if (invites) setPendingInvitations(invites as unknown as Invitation[]);

      // 3. Fetch Accepted Shared Projects
      const { data: acceptedInvites } = await supabase
        .from('invitations')
        .select('project:projects(*)')
        .ilike('email', user.email)
        .eq('status', 'accepted')
        .is('deleted_at', null);

      if (acceptedInvites) {
        const shared = acceptedInvites
          .map((i: unknown) => (i as { project: Project }).project)
          .filter((p): p is Project => Boolean(p && !p.deleted_at));
        setSharedProjects(shared);
      }
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          auth_user_id: currentUser.id,
          title: newTitle.trim(),
          description: newDescription.trim(),
          link_share_permission: newSharePerm,
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically create a default Root Section so the user has an immediate starting point
      if (data) {
        await supabase.from('sections').insert({
          project_id: data.id,
          title: 'General',
          description: 'Default section',
          parent_section_id: null,
          order: 0,
        });

        setShowNewModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewSharePerm('block');
        router.push(`/projects/${data.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (error) throw error;
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error accepting invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (error) throw error;
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error declining invitation');
    }
  };

  const handleDeleteProject = async (projectId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete project "${title}"?`)) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;
      setOwnedProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting project');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Projects & Workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organize, share, and track all your team projects in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Pending Invitations Banner (if any) */}
        {pendingInvitations.length > 0 && (
          <div className="mt-6 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Mail className="w-4 h-4" />
              <span>Pending Invitations ({pendingInvitations.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {inv.project?.title || 'Shared Project'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Role:{' '}
                      <span className="font-semibold capitalize text-primary">{inv.permission}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptInvitation(inv.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineInvitation(inv.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {/* My Projects */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FolderGit2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">My Projects</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                  {ownedProjects.length}
                </span>
              </div>

              {ownedProjects.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card/50">
                  <FolderGit2 className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-foreground">No projects yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Get started by creating your first project
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNewModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {ownedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="group relative flex flex-col justify-between p-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1"
                          >
                            {project.title}
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project.id, project.title)}
                            title="Delete project"
                            className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                          {project.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                          <Share2 className="w-3 h-3" />
                          Link: <span className="capitalize">{project.link_share_permission}</span>
                        </span>

                        <Link
                          href={`/projects/${project.id}`}
                          className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Shared With Me Projects */}
            {sharedProjects.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-foreground">Shared With Me</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                    {sharedProjects.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sharedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="group flex flex-col justify-between p-5 rounded-xl border border-border bg-card hover:border-indigo-500/50 transition-all hover:shadow-md"
                    >
                      <div>
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-bold text-base text-foreground group-hover:text-indigo-500 transition-colors line-clamp-1"
                        >
                          {project.title}
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 min-h-[32px]">
                          {project.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> Collaborator
                        </span>

                        <Link
                          href={`/projects/${project.id}`}
                          className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Create Project Modal (Using Accessible Dialog with Light-Dismiss) */}
        {showNewModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewModal(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Create New Project</h3>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Project Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Website Redesign Q4"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief description of the project goals..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="sharePerm" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Link Share Permission
                  </label>
                  <select
                    id="sharePerm"
                    value={newSharePerm}
                    onChange={(e) => setNewSharePerm(e.target.value as LinkSharePermission)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  >
                    <option value="block">Blocked (Only invited members)</option>
                    <option value="view">View (Anyone with link can view)</option>
                    <option value="comment">Comment (Anyone with link can comment after login)</option>
                    <option value="edit">Edit (Anyone with link can edit after login)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can also invite individual team members by email inside the project.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newTitle.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition shadow-sm"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
