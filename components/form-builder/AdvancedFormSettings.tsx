"use client";

import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStore } from "@/lib/store/formStore";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";

interface AdvancedFormSettingsProps {
  formId?: string;
}

export function AdvancedFormSettings({ formId }: AdvancedFormSettingsProps) {
  const { form, updateForm } = useFormStore();
  const supabase = getSupabaseClient();
  
  const [emailNotifications, setEmailNotifications] = useState(form?.email_notifications || false);
  const [confirmationMessage, setConfirmationMessage] = useState(form?.confirmation_message || "");
  const [requireLogin, setRequireLogin] = useState(form?.require_login || false);
  const [limitSubmissions, setLimitSubmissions] = useState(form?.limit_submissions || false);
  const [maxSubmissionsPerUser, setMaxSubmissionsPerUser] = useState<number | undefined>(
    form?.max_submissions_per_user || 1
  );
  const [isSaving, setIsSaving] = useState(false);

  // Load form data
  useEffect(() => {
    if (formId) {
      const fetchForm = async () => {
        try {
          const { data, error } = await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .single();
            
          if (error) throw new Error(error.message);
          if (data) updateForm(data);
        } catch (error) {
          console.error('Error loading form:', error);
          toast.error('Failed to load form settings');
        }
      };
      
      fetchForm();
    }
  }, [formId, updateForm, supabase]);

  // Update form when store data changes
  useEffect(() => {
    if (form) {
      setEmailNotifications(form.email_notifications || false);
      setConfirmationMessage(form.confirmation_message || "");
      setRequireLogin(form.require_login || false);
      setLimitSubmissions(form.limit_submissions || false);
      setMaxSubmissionsPerUser(form.max_submissions_per_user || 1);
    }
  }, [form]);

  // Save changes to database with the latest state values
  const saveChanges = useCallback(async (
    options?: {
      emailNotif?: boolean;
      confMsg?: string;
      reqLogin?: boolean;
      limitSub?: boolean;
      maxSub?: number | null;
    }
  ) => {
    if (!formId) return;
    
    setIsSaving(true);
    
    try {
      // Use passed values or current state values
      const updates = {
        email_notifications: options?.emailNotif !== undefined ? options.emailNotif : emailNotifications,
        confirmation_message: options?.confMsg !== undefined ? options.confMsg : confirmationMessage,
        require_login: options?.reqLogin !== undefined ? options.reqLogin : requireLogin,
        limit_submissions: options?.limitSub !== undefined ? options.limitSub : limitSubmissions,
        max_submissions_per_user: options?.maxSub !== undefined 
          ? options.maxSub 
          : (limitSubmissions ? maxSubmissionsPerUser : null),
        updated_at: new Date().toISOString()
      };
      
      console.log('Saving form settings:', updates);
      
      const { data, error } = await supabase
        .from('forms')
        .update(updates)
        .eq('id', formId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      if (data) {
        updateForm(data);
        toast.success('Form settings saved');
      }
    } catch (error) {
      console.error('Error saving form settings:', error);
      toast.error('Failed to save form settings');
    } finally {
      setIsSaving(false);
    }
  }, [formId, supabase, emailNotifications, confirmationMessage, requireLogin, limitSubmissions, maxSubmissionsPerUser, updateForm]);

  const handleEmailNotificationsChange = (checked: boolean) => {
    setEmailNotifications(checked);
    saveChanges({ emailNotif: checked });
  };

  const handleConfirmationMessageChange = (value: string) => {
    setConfirmationMessage(value);
    // Don't save immediately for text changes, wait for blur
  };

  const handleConfirmationMessageBlur = () => {
    saveChanges({ confMsg: confirmationMessage });
  };

  const handleRequireLoginChange = (checked: boolean) => {
    setRequireLogin(checked);
    saveChanges({ reqLogin: checked });
  };

  const handleLimitSubmissionsChange = (checked: boolean) => {
    setLimitSubmissions(checked);
    saveChanges({ 
      limitSub: checked,
      maxSub: checked ? maxSubmissionsPerUser : null 
    });
  };

  const handleMaxSubmissionsChange = (value: number) => {
    setMaxSubmissionsPerUser(value);
    // Don't save immediately for number changes, wait for blur
  };

  const handleMaxSubmissionsBlur = () => {
    saveChanges({ maxSub: maxSubmissionsPerUser });
  };

  return (
    <div className="space-y-6">

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Email Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Receive email notifications when someone submits your form
            </p>
          </div>
          <Switch 
            checked={emailNotifications} 
            onCheckedChange={handleEmailNotificationsChange} 
            disabled={isSaving}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Confirmation Message</h3>
              <p className="text-sm text-muted-foreground">
                Show a custom message after form submission
              </p>
            </div>
            <Switch 
              checked={!!confirmationMessage} 
              onCheckedChange={(checked) => {
                if (!checked) {
                  setConfirmationMessage("");
                  saveChanges({ confMsg: "" });
                } else if (!confirmationMessage) {
                  setConfirmationMessage("Thank you for your submission!");
                  saveChanges({ confMsg: "Thank you for your submission!" });
                }
              }} 
              disabled={isSaving}
            />
          </div>
          {confirmationMessage && (
            <Textarea
              value={confirmationMessage}
              onChange={(e) => handleConfirmationMessageChange(e.target.value)}
              onBlur={handleConfirmationMessageBlur}
              placeholder="Enter a confirmation message"
              className="mt-2"
              disabled={isSaving}
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Require Login</h3>
            <p className="text-sm text-muted-foreground">
              Users must be logged in to submit the form
            </p>
          </div>
          <Switch 
            checked={requireLogin} 
            onCheckedChange={handleRequireLoginChange} 
            disabled={isSaving}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">One Submission Per User</h3>
              <p className="text-sm text-muted-foreground">
                Limit submissions to one per user
              </p>
            </div>
            <Switch 
              checked={limitSubmissions} 
              onCheckedChange={handleLimitSubmissionsChange} 
              disabled={isSaving}
            />
          </div>
          {limitSubmissions && (
            <div className="flex items-center gap-2">
              <Label htmlFor="max-submissions">Max submissions:</Label>
              <Input
                id="max-submissions"
                type="number"
                min={1}
                value={maxSubmissionsPerUser}
                onChange={(e) => handleMaxSubmissionsChange(Number(e.target.value))}
                onBlur={handleMaxSubmissionsBlur}
                className="w-20"
                disabled={isSaving}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 