import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Advanced Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Configure advanced settings for your form.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications when someone submits your form
              </p>
            </div>
            <Switch id="email-notifications" />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="success-message" className="text-base">Confirmation Message</Label>
              <p className="text-sm text-muted-foreground">
                Show a custom message after form submission
              </p>
            </div>
            <Switch id="success-message" />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="required-login" className="text-base">Require Login</Label>
              <p className="text-sm text-muted-foreground">
                Users must be logged in to submit the form
              </p>
            </div>
            <Switch id="required-login" />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="one-submission" className="text-base">One Submission Per User</Label>
              <p className="text-sm text-muted-foreground">
                Limit submissions to one per user
              </p>
            </div>
            <Switch id="one-submission" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 