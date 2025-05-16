import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Form field schema
const formSchema = z.strictObject({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  active: z.boolean(),
});

type FormBuilderProps = {
  onSave: (formData: FormValues) => Promise<void>;
  initialData?: FormValues;
  isEditing?: boolean;
  onCancel?: () => void;
  showRedirectSuccess?: boolean;
};

export type FormValues = z.infer<typeof formSchema>;

export function FormBuilder({ 
  onSave, 
  initialData, 
  isEditing = false, 
  onCancel, 
  showRedirectSuccess = false 
}: FormBuilderProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      active: true,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      await onSave(values);
      
      // Только отображаем сообщение об успехе при редактировании
      if (isEditing) {
        toast.success('Form updated successfully');
      }
      
      // Перенаправляем только если явно указано
      if (showRedirectSuccess) {
        router.push('/admin/forms');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/admin/forms');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Form' : 'Create New Form'}</CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update your form details below'
            : 'Enter the basic information for your new form. You can add fields in the next step.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter form title" {...field} />
                  </FormControl>
                  <FormDescription>
                    The title will be displayed to users when filling out the form.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter form description (optional)"
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description that explains the purpose of this form.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Form Status</FormLabel>
                    <FormDescription>
                      {field.value ? 'The form is active and available to users' : 'The form is inactive and hidden from users'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Form' : 'Continue')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 