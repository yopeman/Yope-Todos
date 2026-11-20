import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import {
  CheckCircle2,
  FolderTree,
  MessageSquare,
  Share2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Palette,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-28 border-b border-border bg-gradient-to-b from-card/40 to-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
              <Layers className="w-3.5 h-3.5" />
              <span>Hierarchical Task Management Engineered for Clarity</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
              Organize complex projects into{' '}
              <span className="text-primary bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                effortless workflows
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Structure your work seamlessly with Sections, Subsections, nested Subtasks, collaborative comments, and flexible team sharing.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/projects"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-base font-semibold bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-all hover:scale-[1.02]"
              >
                Go to Workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-base font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors"
              >
                Create Free Account
              </Link>
            </div>

            {/* Visual Hierarchy Diagram / Preview */}
            <div className="mt-16 max-w-4xl mx-auto p-4 sm:p-6 rounded-2xl border border-border bg-card/60 shadow-xl backdrop-blur-sm text-left">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs font-mono text-muted-foreground">project-preview: Yope Todos App</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
                {/* Simulated Sidebar */}
                <div className="md:col-span-4 p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                    Sections (Sidebar)
                  </span>
                  <div className="px-3 py-2 rounded-md bg-primary/10 text-primary text-sm font-medium flex items-center justify-between">
                    <span>1. Core Features</span>
                    <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded">3</span>
                  </div>
                  <div className="px-3 py-2 rounded-md hover:bg-muted text-muted-foreground text-sm font-medium">
                    <span>2. UI / UX Polish</span>
                  </div>
                  <div className="px-3 py-2 rounded-md hover:bg-muted text-muted-foreground text-sm font-medium">
                    <span>3. Storage & Invites</span>
                  </div>
                </div>

                {/* Simulated Workspace */}
                <div className="md:col-span-8 p-3 rounded-lg bg-card border border-border/80 space-y-4">
                  {/* Subsection Tabs */}
                  <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
                    <span className="px-3 py-1 rounded-md text-xs font-bold bg-primary text-primary-foreground">
                      Frontend Next.js
                    </span>
                    <span className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted">
                      Backend Supabase
                    </span>
                    <span className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted">
                      Default
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg border border-border bg-background space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-semibold">Implement 4-Mode Theme Engine</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                          Completed
                        </span>
                      </div>
                      <div className="ml-6 pl-2 border-l-2 border-muted space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Subtask: Add Night (OLED True Black) Mode</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-background flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-blue-500 animate-pulse" />
                        <span className="text-sm font-medium">Project Detail with Comments & Attachments</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> 4
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                          In Progress
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Everything you need to deliver on time
            </h2>
            <p className="mt-3 text-muted-foreground">
              Designed from the ground up for seamless individual clarity and collaborative execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FolderTree className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Two-Tier Hierarchy</h3>
              <p className="text-sm text-muted-foreground">
                Sections as your sidebar pillars, Subsections as dedicated tabs, and Subtasks indented neatly under parent tasks.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">4 Distinct Theme Modes</h3>
              <p className="text-sm text-muted-foreground">
                Choose between crisp Light, modern Dark, ultra-low power OLED Night (true #000000), or System automatic detection.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Task Discussions & Files</h3>
              <p className="text-sm text-muted-foreground">
                Quick comment counters on list cards, full conversation modal with file uploads powered by Supabase Storage.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Flexible Link Sharing</h3>
              <p className="text-sm text-muted-foreground">
                Set link share permissions to blocked, view-only, comment, or edit. Allow guest viewing with required login for contributing.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Mobile Responsive</h3>
              <p className="text-sm text-muted-foreground">
                Seamless experience on desktop, tablet, and mobile with slide-over section drawers and responsive tab navigation.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Postgres Row-Level Security</h3>
              <p className="text-sm text-muted-foreground">
                Strict database-level policies protecting projects, tasks, comments, and storage files according to team roles.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 Yope Todos. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/projects" className="hover:text-foreground">Workspace</Link>
            <Link href="/login" className="hover:text-foreground">Login</Link>
            <Link href="/signup" className="hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
