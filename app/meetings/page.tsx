"use client";

import { Calendar, Clock, Video, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MeetingsPage() {
  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meetings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Schedule and manage your sales meetings
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium">No meetings scheduled</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Schedule your first meeting to start connecting with prospects. Integrate your calendar
          for automated booking and reminders.
        </p>
        <Button className="mt-6 gap-2">
          <Plus className="h-4 w-4" />
          Schedule Your First Meeting
        </Button>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendar Integration</CardTitle>
            <CardDescription className="text-xs">
              Sync with Google Calendar, Outlook, or other providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Connect Calendar
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Video Conferencing</CardTitle>
            <CardDescription className="text-xs">
              Integrate Zoom, Google Meet, or Microsoft Teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="gap-2">
              <Video className="h-3.5 w-3.5" />
              Connect Video
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automated Reminders</CardTitle>
            <CardDescription className="text-xs">
              Send automatic email and SMS reminders to attendees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="gap-2">
              <Clock className="h-3.5 w-3.5" />
              Configure
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
