import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/* ---------------- SCHEMA ---------------- */

const subtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
  description: z.string().optional(),
  hours: z.number().min(0.1, "Hours must be at least 0.1"),
});

const serviceItemSchema = z.object({
  title: z.string().min(1, "Service title is required"),
  description: z.string().optional(),
  rate: z.number().min(1, "Rate must be at least 1"),
  subtasks: z.array(subtaskSchema).optional(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  services: z.array(serviceItemSchema).min(1, "At least one service is required"),
  notes: z.string().optional(),
});

export type InvoiceData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  onSubmit: (data: InvoiceData) => void;
  initialData?: Partial<InvoiceData>;
}

/* ---------------- SUBTASK COMPONENT ---------------- */

const SubtasksFieldArray = ({ nestIndex, control, register }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `services.${nestIndex}.subtasks`,
  });

  return (
    <div className="ml-6 border-l pl-4 space-y-3">
      <h4 className="font-medium text-sm">Subtasks</h4>
      {fields.map((subfield, subIndex) => (
        <div
          key={subfield.id}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 border p-3 rounded"
        >
          <div className="md:col-span-4">
            <Label>Title</Label>
            <Input
              {...register(`services.${nestIndex}.subtasks.${subIndex}.title`)}
              placeholder="e.g. UI Design"
            />
          </div>
          <div className="md:col-span-4">
            <Label>Description (optional)</Label>
            <Textarea
              rows={2}
              {...register(
                `services.${nestIndex}.subtasks.${subIndex}.description`
              )}
              placeholder="Details about this subtask"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Hours</Label>
            <Input
              type="number"
              step="0.1"
              {...register(`services.${nestIndex}.subtasks.${subIndex}.hours`, {
                valueAsNumber: true,
              })}
              placeholder="Hours"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(subIndex)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ title: "", description: "", hours: 1 })}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Subtask
      </Button>
    </div>
  );
};

/* ---------------- MAIN FORM ---------------- */

export const InvoiceForm = ({ onSubmit, initialData }: InvoiceFormProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();

  const form = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber:
        initialData?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate:
        initialData?.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate:
        initialData?.dueDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      services: initialData?.services || [
        {
          title: "Website Development",
          description: "Building a responsive website",
          rate: 50,
          subtasks: [
            { title: "Frontend", description: "React components", hours: 10 },
          ],
        },
      ],
      notes: initialData?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const handleSaveInvoice = async (invoiceData: InvoiceData) => {
    if (!user) return;

    const { error } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        data: invoiceData,
      });

    if (error) {
      console.error("Failed to save invoice:", error);
    }
  };

  const handleSubmit = async (data: InvoiceData) => {
    setIsGenerating(true);
    try {
      await onSubmit(data);
      await handleSaveInvoice(data); // 👈 persist to DB
      toast.success("Invoice saved and generated!");
    } catch (error) {
      toast.error("Failed to save invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  const addService = () => {
    append({
      title: "",
      description: "",
      rate: 50,
      subtasks: [],
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-professional">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Invoice Number</Label>
            <Input {...form.register("invoiceNumber")} placeholder="INV-001" />
          </div>
          <div className="space-y-2">
            <Label>Invoice Date</Label>
            <Input type="date" {...form.register("invoiceDate")} />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" {...form.register("dueDate")} />
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-professional">Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <Card
              key={field.id}
              className="p-4 space-y-4 shadow-sm border rounded-lg"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 space-y-2">
                  <Label>Service Title</Label>
                  <Input
                    {...form.register(`services.${index}.title`)}
                    placeholder="e.g. Website Development"
                  />
                </div>
                <div className="md:col-span-4 space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    {...form.register(`services.${index}.description`)}
                    placeholder="Overview of this service"
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Rate ($/hr)</Label>
                  <Input
                    type="number"
                    step="1"
                    {...form.register(`services.${index}.rate`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Subtasks */}
              <SubtasksFieldArray
                nestIndex={index}
                control={form.control}
                register={form.register}
              />
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addService}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-professional">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register("notes")}
            placeholder="Your notes..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90"
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Invoice"}
        </Button>
      </div>
    </form>
  );
};
