"use client";

import { Mail, Inbox, Send as SendIcon, Archive, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MessagesPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
      <div className="hidden w-64 border-r bg-card lg:block">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="font-semibold">Messages</h2>
        </div>
        <div className="space-y-1 p-2">
          <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
            <Inbox className="h-4 w-4" />
            Inbox
            <Badge variant="secondary" className="ml-auto">
              0
            </Badge>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
            <SendIcon className="h-4 w-4" />
            Sent
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
            <Star className="h-4 w-4" />
            Starred
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
            <Archive className="h-4 w-4" />
            Archived
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">Inbox</h1>
            <Badge variant="secondary">0</Badge>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No messages</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Your inbox is empty. Start a campaign to begin receiving responses from prospects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
