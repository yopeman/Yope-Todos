import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54521';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);
const adminSupabase = createClient(supabaseUrl, serviceKey);

async function test() {
  console.log('Testing Supabase Connection & Schema...');

  // 1. Check tables exist
  const { data: profiles, error: pErr } = await adminSupabase.from('profiles').select('*').limit(1);
  if (pErr) throw new Error('Profiles query failed: ' + pErr.message);
  console.log('✓ profiles table accessible');

  const { data: projects, error: prErr } = await adminSupabase.from('projects').select('*').limit(1);
  if (prErr) throw new Error('Projects query failed: ' + prErr.message);
  console.log('✓ projects table accessible');

  const { data: sections, error: sErr } = await adminSupabase.from('sections').select('*').limit(1);
  if (sErr) throw new Error('Sections query failed: ' + sErr.message);
  console.log('✓ sections table accessible');

  const { data: tasks, error: tErr } = await adminSupabase.from('tasks').select('*').limit(1);
  if (tErr) throw new Error('Tasks query failed: ' + tErr.message);
  console.log('✓ tasks table accessible');

  const { data: comments, error: cErr } = await adminSupabase.from('comments').select('*').limit(1);
  if (cErr) throw new Error('Comments query failed: ' + cErr.message);
  console.log('✓ comments table accessible');

  const { data: invitations, error: iErr } = await adminSupabase.from('invitations').select('*').limit(1);
  if (iErr) throw new Error('Invitations query failed: ' + iErr.message);
  console.log('✓ invitations table accessible');

  // 2. Test user signup & profile creation trigger
  const testEmail = `testuser_${Date.now()}@yopetodos.local`;
  const testPassword = 'Password123!';
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { name: 'Test User' },
    },
  });

  if (authErr) throw new Error('Auth signup failed: ' + authErr.message);
  console.log('✓ User signed up:', authData.user?.id);

  // Check profile created
  const { data: userProfile, error: upErr } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user?.id)
    .single();

  if (upErr || !userProfile) throw new Error('Profile trigger did not create profile');
  console.log('✓ Profile created automatically via trigger:', userProfile.name);

  // 3. Test creating project as authenticated user
  const userClient = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
      },
    },
  });

  const { data: newProj, error: newPErr } = await userClient
    .from('projects')
    .insert({
      auth_user_id: authData.user.id,
      title: 'Demo Project',
      description: 'End to end testing',
      link_share_permission: 'view',
    })
    .select()
    .single();

  if (newPErr) throw new Error('Project creation failed: ' + newPErr.message);
  console.log('✓ Project created with RLS and selected back:', newProj.id, newProj.title);

  // 4. Test creating Section & Subsection
  const { data: rootSec, error: rootSecErr } = await userClient
    .from('sections')
    .insert({
      project_id: newProj.id,
      title: 'Sprint 1',
      parent_section_id: null,
    })
    .select()
    .single();

  if (rootSecErr) throw new Error('Section creation failed: ' + rootSecErr.message);
  console.log('✓ Section created:', rootSec.id, rootSec.title);

  const { data: subSec, error: subSecErr } = await userClient
    .from('sections')
    .insert({
      project_id: newProj.id,
      title: 'Backend Tasks',
      parent_section_id: rootSec.id,
    })
    .select()
    .single();

  if (subSecErr) throw new Error('Subsection created: ' + subSecErr.message);
  console.log('✓ Subsection created:', subSec.id, subSec.title);

  // 5. Test creating Task and Subtask
  const { data: parentTask, error: pTaskErr } = await userClient
    .from('tasks')
    .insert({
      section_id: subSec.id,
      parent_task_id: null,
      title: 'Setup Database Migrations',
      status: 'completed',
    })
    .select()
    .single();

  if (pTaskErr) throw new Error('Task creation failed: ' + pTaskErr.message);
  console.log('✓ Task created:', parentTask.id, parentTask.title);

  const { data: subTask, error: subTaskErr } = await userClient
    .from('tasks')
    .insert({
      section_id: subSec.id,
      parent_task_id: parentTask.id,
      title: 'Write SQL schema file',
      status: 'completed',
    })
    .select()
    .single();

  if (subTaskErr) throw new Error('Subtask creation failed: ' + subTaskErr.message);
  console.log('✓ Subtask created:', subTask.id, subTask.title);

  // 6. Test creating comment
  const { data: comment, error: commentErr } = await userClient
    .from('comments')
    .insert({
      task_id: parentTask.id,
      auth_user_id: authData.user.id,
      comment: 'Schema is tested and working properly!',
    })
    .select()
    .single();

  if (commentErr) throw new Error('Comment creation failed: ' + commentErr.message);
  console.log('✓ Comment posted:', comment.id, comment.comment);

  // 6.5 Test creating invitation with select=*
  const { data: invite, error: inviteErr } = await userClient
    .from('invitations')
    .insert({
      project_id: newProj.id,
      email: 'collaborator@example.com',
      permission: 'edit',
      status: 'pending',
    })
    .select()
    .single();

  if (inviteErr) throw new Error('Invitation creation failed: ' + inviteErr.message);
  console.log('✓ Invitation created with select *:', invite.id, invite.email, invite.permission);

  // 7. Test file upload into storage bucket
  const fileContent = Buffer.from('test attachment content for Yope Todos');
  const filePath = `${parentTask.id}/test-doc.txt`;
  const { data: uploadData, error: uploadErr } = await userClient.storage
    .from('attachments')
    .upload(filePath, fileContent, { contentType: 'text/plain' });

  if (uploadErr) throw new Error('Storage upload failed: ' + uploadErr.message);
  console.log('✓ Attachment uploaded to Supabase Storage:', uploadData.path);

  console.log('\n======================================================');
  console.log('ALL END-TO-END SUPABASE TESTS PASSED PERFECTLY!');
  console.log('======================================================');
}

test().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
