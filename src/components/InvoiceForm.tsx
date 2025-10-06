import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { InvoicePreview } from "./InvoicePreview";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email address").optional(),
  clientAddress: z.string().optional(),
  services: z.array(serviceItemSchema).min(1, "At least one service is required"),
  notes: z.string().optional(),
});

interface UserConfig {
  company_name?: string;
  company_address?: string;
  company_email?: string;
  company_phone?: string;
  company_website?: string;
  bank_details?: string;
}

export type InvoiceData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  onSubmit: (data: InvoiceData) => void;
  initialData?: Partial<InvoiceData>;
  editId?: string | null;
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

/* ---------------- INVOICE NUMBER GENERATION UTILITY ---------------- */

const generateNextInvoiceNumber = async (userId: string): Promise<string> => {
  try {
    // Get recent invoices for this user to find the highest number
    // Using limit and recent data should be sufficient for most cases
    const { data, error } = await supabase
      .from('invoices')
      .select('data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100); // Limit to recent 100 invoices for performance

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching invoices for numbering:', error);
      return 'INV-001'; // Default to first invoice if query fails
    }

    let highestNumber = 0;
    
    if (data && data.length > 0) {
      // Find the highest invoice number among recent invoices
      for (const invoice of data) {
        if (invoice.data && invoice.data.invoiceNumber) {
          const invoiceNumber = invoice.data.invoiceNumber;
          // Extract number from format like "INV-001", "INV-0123", etc.
          const numberMatch = invoiceNumber.match(/INV-(\d+)/);
          if (numberMatch) {
            const currentNumber = parseInt(numberMatch[1], 10);
            if (currentNumber > highestNumber) {
              highestNumber = currentNumber;
            }
          }
        }
      }
      
      // If we hit the limit, there might be higher numbers in older invoices
      // In that case, we should query more or add a database function
      // For now, this should work for most use cases
    }
    
    const nextNumber = highestNumber + 1;
    
    // Format with leading zeros (3 digits minimum)
    return `INV-${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return 'INV-001'; // Fallback to default
  }
};

/* ---------------- PDF GENERATION & UPLOAD UTILITY ---------------- */

const createPdfAndUpload = async (invoiceData: InvoiceData, htmlElement: HTMLDivElement, userId: string): Promise<string | null> => {
  if (!htmlElement) {
    toast.error("PDF generation failed: Preview element not found.");
    return null;
  }
  
  try {
    // 1. Generate canvas from HTML with high quality settings
    const canvas = await html2canvas(htmlElement, {
      scale: 4, // Much higher resolution for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      letterRendering: true,
      windowWidth: htmlElement.scrollWidth,
      windowHeight: htmlElement.scrollHeight,
      scrollY: -window.scrollY, // Correctly captures the hidden element
      x: 0,
      y: 0,
      width: htmlElement.scrollWidth,
      height: htmlElement.scrollHeight,
    });

    // 2. Convert canvas to PDF using jsPDF with high quality
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false,
      precision: 16
    });
    
    // Calculate dimensions for A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page image
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Handle subsequent pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const pdfBlob = pdf.output('blob');
    
    // 3. Upload to Supabase Storage
    const fileName = `invoices/${userId}/${invoiceData.invoiceNumber}-${Date.now()}.pdf`;
    
    // NOTE: A public bucket named 'invoices_pdfs' is required in Supabase Storage.
    const { error: uploadError } = await supabase.storage
      .from('invoices_pdfs') 
      .upload(fileName, pdfBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });
      
    if (uploadError) {
      console.error("Supabase storage upload failed:", uploadError);
      throw new Error("Failed to upload PDF");
    }

    // 4. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('invoices_pdfs')
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;

  } catch (err) {
    console.error("PDF generation or upload failed:", err);
    return null;
  }
};


/* ---------------- MAIN FORM ---------------- */

export const InvoiceForm = ({ onSubmit, initialData, editId }: InvoiceFormProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const invoicePreviewRef = useRef<HTMLDivElement>(null); // Ref for the hidden preview component
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState<string>('');

  const form = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber:
        initialData?.invoiceNumber || generatedInvoiceNumber || 'INV-001',
      invoiceDate:
        initialData?.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate:
        initialData?.dueDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      clientName: initialData?.clientName || "",
      clientEmail: initialData?.clientEmail || "",
      clientAddress: initialData?.clientAddress || "",
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

  useEffect(() => {
    const fetchUserConfig = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('user_invoice_configs')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) setUserConfig(data);
      } catch (error) {
        console.error("Failed to fetch user invoice settings:", error);
        toast.error("Could not load your invoice settings.");
      }
    };
    fetchUserConfig();
  }, [user]);

  // Generate sequential invoice number for new invoices
  useEffect(() => {
    const generateInvoiceNumber = async () => {
      if (!user || editId || initialData?.invoiceNumber) return; // Don't generate for edit mode or if already provided
      
      try {
        const nextNumber = await generateNextInvoiceNumber(user.id);
        setGeneratedInvoiceNumber(nextNumber);
        
        // Update form with the generated number
        form.setValue('invoiceNumber', nextNumber);
      } catch (error) {
        console.error('Failed to generate invoice number:', error);
        const fallback = 'INV-001';
        setGeneratedInvoiceNumber(fallback);
        form.setValue('invoiceNumber', fallback);
      }
    };
    
    generateInvoiceNumber();
  }, [user, editId, initialData?.invoiceNumber, form]);

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset({
        invoiceNumber: initialData.invoiceNumber,
        invoiceDate: initialData.invoiceDate,
        dueDate: initialData.dueDate,
        clientName: initialData.clientName || "",
        clientEmail: initialData.clientEmail || "",
        clientAddress: initialData.clientAddress || "",
        services: initialData.services || [],
        notes: initialData.notes || "",
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (invoiceData: InvoiceData) => {
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }
    
    setIsGenerating(true);
    let pdfPath: string | null = null;
    
    try {
      // 1. Generate PDF and upload to Supabase Storage
      if (invoicePreviewRef.current) {
        toast.info("Generating and uploading PDF...");
        pdfPath = await createPdfAndUpload(invoiceData, invoicePreviewRef.current, user.id);
        if (!pdfPath) {
          throw new Error("PDF generation failed.");
        }
      } else {
        throw new Error("Invoice preview element is missing for PDF generation.");
      }

      // 2. Persist invoice data and PDF path to DB
      let dbError;
      if (editId) {
        // Update existing invoice
        const { error } = await supabase
          .from("invoices")
          .update({
            data: invoiceData,
            pdf_path: pdfPath,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editId)
          .eq('user_id', user.id);
        dbError = error;
      } else {
        // Create new invoice
        const { error } = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            data: invoiceData,
            pdf_path: pdfPath,
          });
        dbError = error;
      }

      if (dbError) {
        console.error("Failed to save invoice:", dbError);
        throw new Error("Failed to save invoice data to DB.");
      }
      
      // 3. Call parent onSubmit and navigate away
      onSubmit(invoiceData); 
      toast.success(editId ? "Invoice updated successfully!" : "Invoice saved and generated!");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Submission error:", error);
      toast.error(`Failed to complete invoice generation: ${errorMessage}`);
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

  const watchAllFields = form.watch(); // Rerender preview on form change
  
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: -1 }}>
        <InvoicePreview 
          data={watchAllFields as InvoiceData} 
          userConfig={userConfig} 
          ref={invoicePreviewRef} 
        />
      </div>
      
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

      {/* +++ Add Client Details Card +++ */}
      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input {...form.register("clientName")} placeholder="Client's Full Name" />
            </div>
            <div className="space-y-2">
              <Label>Client Email (optional)</Label>
              <Input type="email" {...form.register("clientEmail")} placeholder="client@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Client Address (optional)</Label>
            <Textarea {...form.register("clientAddress")} placeholder="Client's Billing Address" rows={2} />
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
                  <Label>Rate (€/hr)</Label>
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
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            "Generate Invoice"
          )}
        </Button>
      </div>
    </form>
  );
};
