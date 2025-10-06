import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InvoiceForm, InvoiceData } from "@/components/InvoiceForm";
import { InvoicePreview } from "@/components/InvoicePreview";
import { generatePDF } from "@/utils/pdfGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { UserSettingsDialog } from "@/components/UserSettingsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const InvoiceGenerator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userConfig, setUserConfig] = useState<any>(null);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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
      } catch (err) {
        console.error('Error fetching user config:', err);
      }
    };
    fetchUserConfig();
  }, [user]);

  // Handle edit mode - load existing invoice data
  useEffect(() => {
    const editIdParam = searchParams.get('edit');
    if (editIdParam && user) {
      setEditId(editIdParam);
      loadInvoiceForEdit(editIdParam);
    } else {
      setEditId(null);
      setInvoiceData(null);
    }
  }, [searchParams, user]);

  const loadInvoiceForEdit = async (invoiceId: string) => {
    setIsLoadingEditData(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user?.id)
        .single();
        
      if (error || !data) {
        throw new Error("Invoice not found or access denied.");
      }
      
      // Set the invoice data for editing
      setInvoiceData(data.data as InvoiceData);
      toast.success("Invoice loaded for editing");
    } catch (error) {
      console.error("Error loading invoice for edit:", error);
      toast.error("Failed to load invoice data");
    } finally {
      setIsLoadingEditData(false);
    }
  };

  const handleInvoiceSubmit = (data: InvoiceData) => {
    setInvoiceData(data);
    setShowPreview(true);
  };

  const handleDownloadPDF = async () => {
    if (!invoiceData || !previewRef.current) {
      toast.error("No invoice data available");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      await generatePDF(previewRef.current, invoiceData);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEditInvoice = () => {
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenSettings={() => setShowSettings(true)} />
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Back to Dashboard Button */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>

        {!showPreview ? (
          <div className="max-w-4xl mx-auto">
            {isLoadingEditData ? (
              <div className="flex justify-center items-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading invoice data...</p>
                </div>
              </div>
            ) : (
              <InvoiceForm 
                onSubmit={handleInvoiceSubmit} 
                initialData={invoiceData || undefined} 
                editId={editId}
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Bar */}
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-2 text-professional">
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold">Invoice Preview</span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleEditInvoice}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Edit Invoice
                    </Button>
                    <Button
                      onClick={handleDownloadPDF}
                      disabled={isGeneratingPDF}
                      className="bg-success hover:bg-success/90 text-success-foreground flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {isGeneratingPDF ? "Generating..." : "Download PDF"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Preview */}
            <div className="max-w-4xl mx-auto">
              <InvoicePreview ref={previewRef} data={invoiceData!} userConfig={userConfig} />
            </div>
          </div>
        )}
        </div>
      </div>
      
      <UserSettingsDialog 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  );
};

export default InvoiceGenerator;