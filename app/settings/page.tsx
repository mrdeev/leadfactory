"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Settings className="mb-4 h-12 w-12 text-muted-foreground/20" />
        <h3 className="text-lg font-medium">Coming Soon</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Account settings, API key management, and preferences will be available here.
        </p>
      </div>
    </div>
  );
}
