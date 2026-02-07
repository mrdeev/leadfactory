"use client";

import { Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CampaignsPage() {
  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create and manage your outreach campaigns
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Send className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium">No campaigns yet</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Create your first campaign to start automated outreach with AI-generated messages,
          smart follow-ups, and performance tracking.
        </p>
        <Button className="mt-6 gap-2">
          <Plus className="h-4 w-4" />
          Create Your First Campaign
        </Button>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Multi-Touch Sequences</CardTitle>
            <CardDescription className="text-xs">
              Set up automated follow-up sequences with personalized messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Coming soon</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">A/B Testing</CardTitle>
            <CardDescription className="text-xs">
              Test different message variations to optimize response rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Coming soon</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Analytics</CardTitle>
            <CardDescription className="text-xs">
              Track opens, clicks, responses, and conversion metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Coming soon</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
