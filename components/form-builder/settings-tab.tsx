"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdvancedFormSettings } from "@/components/form-builder/AdvancedFormSettings";

export function SettingsTab() {
  const params = useParams<{ id: string }>();
  const formId = params.id as string;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Advanced Settings</CardTitle>
        <CardDescription>

        Configure advanced settings for your form.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AdvancedFormSettings formId={formId} />
      </CardContent>
    </Card>
  );
} 