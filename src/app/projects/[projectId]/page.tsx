'use client';

import React, { useState, useEffect, useCallback, use, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { SectionSidebar } from '@/components/project-detail/SectionSidebar';
import { SubsectionTabs } from '@/components/project-detail/SubsectionTabs';
import { TaskList } from '@/components/project-detail/TaskList';
import { CommentModal } from '@/components/project-detail/CommentModal';
import { ShareProjectModal } from '@/components/project-detail/ShareProjectModal';
import { AddTaskDialog } from '@/components/project-detail/AddTaskDialog';
import type {
  Project,
  Section,
  Task,
  TaskStatus,
} from '@/types/database';
import {
  FolderGit2,
  Share2,
  PanelLeft,
  Loader2,
  Lock,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

function ProjectDetailContent({ params }: ProjectDetailPageProps) {
  const { projectId } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [subsections, setSubsections] = useState<Section[]>([]);
  const [activeSubsectionId, setActiveSubsectionId] = useState<string>('default');
  const [tasks, setTasks] = useState<Task[]>([]);

  // Permissions
  const [userRole, setUserRole] = useState<'owner' | 'edit' | 'comment' | 'view' | 'none'>('none');
  const [canEdit, setCanEdit] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const supabase = createClient();

  // 1. Load Project & Calculate Permissions
  const loadProjectAndPermissions = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch project
    const { data: projData, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single();

    if (projError || !projData) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    setProject(projData);

    // Calculate Role
    let role: 'owner' | 'edit' | 'comment' | 'view' | 'none' = 'none';

    if (user && projData.auth_user_id === user.id) {
      role = 'owner';
    } else if (user && user.email) {
      // Check accepted invitation
      const { data: inv } = await supabase
        .from('invitations')
        .select('permission')
        .eq('project_id', projectId)
        .ilike('email', user.email)
        .eq('status', 'accepted')
        .is('deleted_at', null)
        .maybeSingle();

      if (inv) {
        role = inv.permission as 'edit' | 'comment' | 'view';
      }
    }

    // Check link sharing if no direct role found yet
    if (role === 'none' && projData.link_share_permission !== 'block') {
      if (projData.link_share_permission === 'view') {
        role = 'view';
      } else if (projData.link_share_permission === 'comment') {
        role = user ? 'comment' : 'view';
      } else if (projData.link_share_permission === 'edit') {
        role = user ? 'edit' : 'view';
      }
    }

    if (role === 'none') {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    setUserRole(role);
    setCanEdit(role === 'owner' || role === 'edit');
    setCanComment(role === 'owner' || role === 'edit' || role === 'comment');

    // 2. Load Sections
    const { data: secData } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('order', { ascending: true })
      .order('created_at', { ascending: true });

    if (secData) {
      const rootSections = secData.filter((s: Section) => s.parent_section_id === null);
      setSections(rootSections);

      // Set initial active section
      if (rootSections.length > 0) {
        setActiveSectionId((prev) => prev || rootSections[0].id);
      }
    }

    setLoading(false);
  }, [projectId, supabase]);

  useEffect(() => {
    loadProjectAndPermissions();
  }, [loadProjectAndPermissions]);

  // 2. Load Subsections when active Section changes
  const loadSubsections = useCallback(async () => {
    if (!activeSectionId) return;

    const { data } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId)
      .eq('parent_section_id', activeSectionId)
      .is('deleted_at', null)
      .order('order', { ascending: true });

    if (data) {
      setSubsections(data);
      // If current subsection is not valid for this section, fallback to 'default'
      if (activeSubsectionId !== 'default' && !data.some((s) => s.id === activeSubsectionId)) {
        setActiveSubsectionId('default');
      }
    }
  }, [activeSectionId, activeSubsectionId, projectId, supabase]);

  useEffect(() => {
    loadSubsections();
  }, [loadSubsections]);

  // 3. Load Tasks & Subtasks & Comment Counts
  const loadTasks = useCallback(async () => {
    if (!activeSectionId) return;

    // Determine target section_id for tasks
    const targetSectionId = activeSubsectionId === 'default' ? activeSectionId : activeSubsectionId;

    // Fetch parent tasks
    const { data: parentTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('section_id', targetSectionId)
      .is('parent_task_id', null)
      .is('deleted_at', null)
      .order('order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!parentTasks) {
      setTasks([]);
      return;
    }

    const parentIds = parentTasks.map((t: Task) => t.id);

    // Fetch subtasks
    let subtasksData: Task[] = [];
    if (parentIds.length > 0) {
      const { data: subs } = await supabase
        .from('tasks')
        .select('*')
        .in('parent_task_id', parentIds)
        .is('deleted_at', null)
        .order('order', { ascending: true })
        .order('created_at', { ascending: true });

      if (subs) subtasksData = subs;
    }

    // Fetch comment counts for all tasks & subtasks
    const allTaskIds = [...parentIds, ...subtasksData.map((s: Task) => s.id)];
    const commentCountMap = new Map<string, number>();

    if (allTaskIds.length > 0) {
      const { data: comments } = await supabase
        .from('comments')
        .select('task_id')
        .in('task_id', allTaskIds)
        .is('deleted_at', null);

      if (comments) {
        comments.forEach((c: { task_id: string }) => {
          commentCountMap.set(c.task_id, (commentCountMap.get(c.task_id) || 0) + 1);
        });
      }
    }

    // Merge subtasks and counts into parent tasks
    const enrichedTasks: Task[] = parentTasks.map((t: Task) => {
      const children = subtasksData
        .filter((s: Task) => s.parent_task_id === t.id)
        .map((s: Task) => ({
          ...s,
          comments_count: commentCountMap.get(s.id) || 0,
        }));

      return {
        ...t,
        subtasks: children,
        comments_count: commentCountMap.get(t.id) || 0,
      };
    });

    setTasks(enrichedTasks);
  }, [activeSectionId, activeSubsectionId, supabase]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Section Handlers
  const handleAddSection = async (title: string) => {
    const { data, error } = await supabase
      .from('sections')
      .insert({
        project_id: projectId,
        parent_section_id: null,
        title,
        order: sections.length,
      })
      .select()
      .single();

    if (error) alert(error.message);
    else if (data) {
      setSections((prev) => [...prev, data]);
      setActiveSectionId(data.id);
    }
  };

  const handleRenameSection = async (sectionId: string, newTitle: string) => {
    const { error } = await supabase
      .from('sections')
      .update({ title: newTitle, updated_at: new Date().toISOString() })
      .eq('id', sectionId);

    if (error) alert(error.message);
    else {
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s))
      );
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    const { error } = await supabase
      .from('sections')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', sectionId);

    if (error) alert(error.message);
    else {
      const remaining = sections.filter((s) => s.id !== sectionId);
      setSections(remaining);
      if (activeSectionId === sectionId && remaining.length > 0) {
        setActiveSectionId(remaining[0].id);
      }
    }
  };

  // Subsection Handlers
  const handleAddSubsection = async (title: string) => {
    if (!activeSectionId) return;
    const { data, error } = await supabase
      .from('sections')
      .insert({
        project_id: projectId,
        parent_section_id: activeSectionId,
        title,
        order: subsections.length,
      })
      .select()
      .single();

    if (error) alert(error.message);
    else if (data) {
      setSubsections((prev) => [...prev, data]);
      setActiveSubsectionId(data.id);
    }
  };

  const handleDeleteSubsection = async (subsectionId: string) => {
    const { error } = await supabase
      .from('sections')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', subsectionId);

    if (error) alert(error.message);
    else {
      setSubsections((prev) => prev.filter((s) => s.id !== subsectionId));
      if (activeSubsectionId === subsectionId) {
        setActiveSubsectionId('default');
      }
    }
  };

  // Task Handlers
  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) alert(error.message);
    else {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) alert(error.message);
    else {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  // Subtask Handlers
  const handleAddSubtask = async (parentTaskId: string, title: string) => {
    const targetSectionId = activeSubsectionId === 'default' ? activeSectionId : activeSubsectionId;
    if (!targetSectionId) return;

    const { error } = await supabase.from('tasks').insert({
      section_id: targetSectionId,
      parent_task_id: parentTaskId,
      title,
      status: 'pending',
      order: 0,
    });

    if (error) alert(error.message);
    else loadTasks();
  };

  const handleUpdateSubtaskStatus = async (subtaskId: string, status: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', subtaskId);

    if (error) alert(error.message);
    else {
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          subtasks: (t.subtasks || []).map((s) =>
            s.id === subtaskId ? { ...s, status } : s
          ),
        }))
      );
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', subtaskId);

    if (error) alert(error.message);
    else {
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId),
        }))
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (accessDenied || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            This project is private or does not exist. Ask the project owner to grant you access.
          </p>
          <Link
            href="/projects"
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  const activeSection = sections.find((s) => s.id === activeSectionId);
  const targetSectionId = activeSubsectionId === 'default' ? activeSectionId : activeSubsectionId;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Top Project Sub-header */}
      <div className="border-b border-border bg-card/70 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            {/* Mobile Sidebar toggle button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              aria-label="Open Sections Drawer"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <FolderGit2 className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </Link>

            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />

            <span className="font-bold text-foreground truncate max-w-[200px] sm:max-w-xs">
              {project.title}
            </span>

            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary font-semibold text-secondary-foreground capitalize">
              {userRole}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-semibold transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Sidebar (Sections) + Content (Tabs & Tasks) */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sections Sidebar (Desktop + Mobile) */}
        <SectionSidebar
          sections={sections}
          activeSectionId={activeSectionId}
          canEdit={canEdit}
          onSelectSection={(secId) => {
            setActiveSectionId(secId);
            setActiveSubsectionId('default');
          }}
          onAddSection={handleAddSection}
          onRenameSection={handleRenameSection}
          onDeleteSection={handleDeleteSection}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {sections.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <h3 className="text-base font-bold text-foreground">No sections in this project</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Create your first section using the sidebar to start organizing tasks.
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleAddSection('General')}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                >
                  Create &quot;General&quot; Section
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Subsections Tab Bar */}
              <SubsectionTabs
                subsections={subsections}
                activeSubsectionId={activeSubsectionId}
                canEdit={canEdit}
                onSelectSubsection={(subId) => setActiveSubsectionId(subId)}
                onAddSubsection={handleAddSubsection}
                onDeleteSubsection={handleDeleteSubsection}
              />

              {/* Tasks List Content */}
              <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-foreground">
                    {activeSubsectionId === 'default'
                      ? `${activeSection?.title || 'Section'} Todos`
                      : subsections.find((s) => s.id === activeSubsectionId)?.title || 'Subsection Todos'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeSubsectionId === 'default'
                      ? 'Tasks assigned directly to this section'
                      : `Tasks under ${subsections.find((s) => s.id === activeSubsectionId)?.title}`}
                  </p>
                </div>

                <TaskList
                  tasks={tasks}
                  canEdit={canEdit}
                  onOpenAddTask={() => setIsAddTaskOpen(true)}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onDeleteTask={handleDeleteTask}
                  onAddSubtask={handleAddSubtask}
                  onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
                  onDeleteSubtask={handleDeleteSubtask}
                  onOpenComments={(t) => setCommentTask(t)}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add Task Dialog */}
      {targetSectionId && (
        <AddTaskDialog
          isOpen={isAddTaskOpen}
          canEdit={canEdit}
          sectionId={targetSectionId}
          onClose={() => setIsAddTaskOpen(false)}
          onTaskCreated={loadTasks}
        />
      )}

      {/* Comment Modal */}
      <CommentModal
        task={commentTask}
        canComment={canComment}
        onClose={() => setCommentTask(null)}
        onCommentsUpdated={loadTasks}
      />

      {/* Share & Collaboration Modal */}
      <ShareProjectModal
        project={project}
        isOpen={isShareModalOpen}
        canManageShare={userRole === 'owner'}
        onClose={() => setIsShareModalOpen(false)}
        onProjectUpdated={(upd) => setProject(upd)}
      />
    </div>
  );
}

export default function ProjectDetailPage(props: ProjectDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProjectDetailContent {...props} />
    </Suspense>
  );
}
