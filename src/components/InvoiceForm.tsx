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

const serviceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  hours: z.number().min(0.1, "Hours must be at least 0.1"),
  rate: z.number().min(1, "Rate must be at least 1"),
});

const invoiceSchema = z.object({
  // Business Info
  businessName: z.string().min(1, "Business name is required"),
  businessEmail: z.string().email("Valid email is required"),
  businessAddress: z.string().min(1, "Business address is required"),
  businessPhone: z.string().optional(),
  
  // Client Info
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  
  // Invoice Details
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  
  // Services
  services: z.array(serviceItemSchema).min(1, "At least one service is required"),
  
  // Additional Info
  notes: z.string().optional(),
});

export type InvoiceData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  onSubmit: (data: InvoiceData) => void;
  initialData?: Partial<InvoiceData>;
}

export const InvoiceForm = ({ onSubmit, initialData }: InvoiceFormProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      businessName: initialData?.businessName || "Marcos Oriol - Web Developer",
      businessEmail: initialData?.businessEmail || "marcos@example.com",
      businessAddress: initialData?.businessAddress || "",
      businessPhone: initialData?.businessPhone || "",
      clientName: initialData?.clientName || "",
      clientEmail: initialData?.clientEmail || "",
      clientAddress: initialData?.clientAddress || "",
      invoiceNumber: initialData?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: initialData?.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: initialData?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      services: initialData?.services || [
        { description: "Website Development", hours: 1, rate: 50 }
      ],
      notes: initialData?.notes || "Thank you for your business!",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const handleSubmit = async (data: InvoiceData) => {
    setIsGenerating(true);
    try {
      await onSubmit(data);
      toast.success("Invoice generated successfully!");
    } catch (error) {
      toast.error("Failed to generate invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  const addService = () => {
    append({ description: "", hours: 1, rate: 50 });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-professional">Your Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                {...form.register("businessName")}
                placeholder="Your Business Name"
              />
              {form.formState.errors.businessName && (
                <p className="text-sm text-destructive">{form.formState.errors.businessName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                {...form.register("businessEmail")}
                placeholder="business@example.com"
              />
              {form.formState.errors.businessEmail && (
                <p className="text-sm text-destructive">{form.formState.errors.businessEmail.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business Address</Label>
            <Textarea
              id="businessAddress"
              {...form.register("businessAddress")}
              placeholder="Your business address"
              rows={2}
            />
            {form.formState.errors.businessAddress && (
              <p className="text-sm text-destructive">{form.formState.errors.businessAddress.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessPhone">Phone (Optional)</Label>
            <Input
              id="businessPhone"
              {...form.register("businessPhone")}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-professional">Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                {...form.register("clientName")}
                placeholder="Client Name"
              />
              {form.formState.errors.clientName && (
                <p className="text-sm text-destructive">{form.formState.errors.clientName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                {...form.register("clientEmail")}
                placeholder="client@example.com"
              />
              {form.formState.errors.clientEmail && (
                <p className="text-sm text-destructive">{form.formState.errors.clientEmail.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientAddress">Client Address</Label>
            <Textarea
              id="clientAddress"
              {...form.register("clientAddress")}
              placeholder="Client address"
              rows={2}
            />
            {form.formState.errors.clientAddress && (
              <p className="text-sm text-destructive">{form.formState.errors.clientAddress.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-professional">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                {...form.register("invoiceNumber")}
                placeholder="INV-001"
              />
              {form.formState.errors.invoiceNumber && (
                <p className="text-sm text-destructive">{form.formState.errors.invoiceNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                {...form.register("invoiceDate")}
              />
              {form.formState.errors.invoiceDate && (
                <p className="text-sm text-destructive">{form.formState.errors.invoiceDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate")}
              />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-destructive">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
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
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg">
              <div className="md:col-span-6 space-y-2">
                <Label htmlFor={`services.${index}.description`}>Description</Label>
                <Input
                  {...form.register(`services.${index}.description`)}
                  placeholder="Web development service"
                />
                {form.formState.errors.services?.[index]?.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.services[index]?.description?.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor={`services.${index}.hours`}>Hours</Label>
                <Input
                  type="number"
                  step="0.1"
                  {...form.register(`services.${index}.hours`, { valueAsNumber: true })}
                  placeholder="1"
                />
                {form.formState.errors.services?.[index]?.hours && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.services[index]?.hours?.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor={`services.${index}.rate`}>Rate ($)</Label>
                <Input
                  type="number"
                  {...form.register(`services.${index}.rate`, { valueAsNumber: true })}
                  placeholder="50"
                />
                {form.formState.errors.services?.[index]?.rate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.services[index]?.rate?.message}
                  </p>
                )}
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
          ))}
          <Button type="button" variant="outline" onClick={addService} className="w-full">
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
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Thank you for your business!"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
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