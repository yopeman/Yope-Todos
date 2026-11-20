'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeSwitcher } from './ThemeSwitcher';
import { CheckSquare, FolderGit2, User, LogOut, Menu, X } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span>Yope Todos</span>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center ml-6 space-x-1">
                <Link
                  href="/projects"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith('/projects')
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FolderGit2 className="w-4 h-4" />
                    Projects
                  </span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher />

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2 pl-2 border-l border-border">
                    <Link
                      href="/profile"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        pathname === '/profile'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span className="max-w-[120px] truncate">
                        {user.user_metadata?.name || user.email?.split('@')[0]}
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      title="Sign Out"
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pl-2 border-l border-border">
                    <Link
                      href="/login"
                      className="px-3.5 py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="px-3.5 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm hover:opacity-90 transition-opacity"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeSwitcher />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 pt-2 pb-4 space-y-2">
          {user ? (
            <>
              <Link
                href="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
              >
                <FolderGit2 className="w-4 h-4" />
                Projects
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
              >
                <User className="w-4 h-4" />
                Profile ({user.user_metadata?.name || user.email})
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium border border-border rounded-md hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm hover:opacity-90"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
