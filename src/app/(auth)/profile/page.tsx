'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { useTheme } from '@/lib/theme/ThemeProvider';
import type { Profile, ThemeMode } from '@/types/database';
import { User, Mail, Shield, Check, Loader2, Palette, Sun, Moon, Sparkles, Monitor } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { setTheme: setAppTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [themePref, setThemePref] = useState<ThemeMode>('system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setName(data.name || '');
        setThemePref(data.theme_preference || 'system');
      } else if (error) {
        // If trigger didn't fire or profile not yet created, synthesize one
        const fallbackProfile: Profile = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          avatar_url: null,
          theme_preference: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        setName(fallbackProfile.name || '');
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          email: profile.email,
          name: name.trim(),
          theme_preference: themePref,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Also update auth user metadata
      await supabase.auth.updateUser({
        data: { name: name.trim() },
      });

      // Apply theme
      setAppTheme(themePref);

      setSuccessMessage('Profile and preferences updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const themeOptions: { id: ThemeMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', desc: 'Crisp high-contrast day theme', icon: <Sun className="w-5 h-5" /> },
    { id: 'dark', label: 'Dark', desc: 'Standard slate neutral tones', icon: <Moon className="w-5 h-5" /> },
    { id: 'night', label: 'Night', desc: 'Pure black (#000000) OLED display mode', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'system', label: 'System', desc: 'Follows your operating system preference', icon: <Monitor className="w-5 h-5" /> },
  ];

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Profile & Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal profile and display preferences
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {errorMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20">
                  {name ? name.slice(0, 2).toUpperCase() : profile?.email.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{name || 'Your Name'}</h2>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="displayName" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                    <input
                      id="displayName"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      placeholder="Your Full Name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      disabled
                      value={profile?.email || ''}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-border bg-muted/50 text-muted-foreground text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Managed by Supabase Authentication
                  </p>
                </div>
              </div>

              {/* Theme Preference */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-primary" />
                  <label className="text-sm font-semibold text-foreground">
                    Theme Preference
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {themeOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                        themePref === opt.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-background hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={opt.id}
                        checked={themePref === opt.id}
                        onChange={() => setThemePref(opt.id)}
                        className="mt-1 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                          {opt.icon}
                          <span>{opt.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition shadow-sm"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Security Information */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Authentication & Security</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your account is authenticated securely via Supabase Auth. All project data, sections, tasks, comments, and attachments are governed by database-enforced Row Level Security (RLS) policies.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
