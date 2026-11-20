export type ThemeMode = 'light' | 'dark' | 'night' | 'system';

export type LinkSharePermission = 'block' | 'view' | 'comment' | 'edit';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type InvitationPermission = 'view' | 'comment' | 'edit';

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface FileAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
  path?: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  theme_preference: ThemeMode;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  auth_user_id: string;
  title: string;
  description: string;
  status: string;
  link_share_permission: LinkSharePermission;
  order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Section {
  id: string;
  project_id: string;
  parent_section_id: string | null; // null = Section, non-null = Subsection
  title: string;
  description: string;
  status: string;
  order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Task {
  id: string;
  section_id: string;
  parent_task_id: string | null; // null = Task, non-null = Subtask
  title: string;
  description: string;
  attachment_paths: FileAttachment[];
  order: number;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  uploaded_at: string | null;
  deleted_at: string | null;
  // Computed / client joined properties
  subtasks?: Task[];
  comments_count?: number;
}

export interface Comment {
  id: string;
  task_id: string;
  auth_user_id: string;
  comment: string;
  attachment_paths: FileAttachment[];
  created_at: string;
  updated_at: string;
  uploaded_at: string | null;
  deleted_at: string | null;
  author?: Profile | null;
}

export interface Invitation {
  id: string;
  project_id: string;
  email: string;
  permission: InvitationPermission;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  project?: Project;
}
