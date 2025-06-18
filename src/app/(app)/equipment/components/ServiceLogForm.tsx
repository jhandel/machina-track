"use client";

import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { serviceRecordService } from "@/services/service-record-service";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  date: z.string().min(1, { message: "Date is required" }),
  performedBy: z.string().min(1, { message: "Performed by is required" }),
  descriptionOfWork: z
    .string()
    .min(1, { message: "Description of work is required" }),
  cost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ServiceLogFormProps {
  equipmentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function ServiceLogForm({
  equipmentId,
  onSuccess,
  onCancel,
  isModal = false,
}: ServiceLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Set default date to today
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: today,
      performedBy: "",
      descriptionOfWork: "",
      cost: undefined,
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      // Create service record directly tied to equipment
      await serviceRecordService.create({
        equipmentId,
        date: values.date,
        performedBy: values.performedBy,
        descriptionOfWork: values.descriptionOfWork,
        cost: values.cost,
        notes: values.notes || undefined,
      });

      toast({
        title: "Service Log Added",
        description: "The service log has been recorded successfully.",
      });

      if (onSuccess) {
        onSuccess();
      } else if (!isModal) {
        router.push(`/equipment/${equipmentId}`);
      }
    } catch (error) {
      console.error("Error creating service log:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add service log",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="performedBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Performed By</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter name of service provider"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descriptionOfWork"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description of Work</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the service work performed"
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Enter the cost of service (if applicable)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or comments"
                  className="min-h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Service Log"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
