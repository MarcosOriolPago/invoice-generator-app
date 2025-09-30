import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { InvoiceForm, InvoiceData } from "@/components/InvoiceForm";
import { InvoicePreview } from "@/components/InvoicePreview";
import { generatePDF } from "@/utils/pdfGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { UserSettingsDialog } from "@/components/UserSettingsDialog";

const InvoiceGenerator = () => {
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

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
            <InvoiceForm onSubmit={handleInvoiceSubmit} initialData={invoiceData || undefined} />
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
              <InvoicePreview ref={previewRef} data={invoiceData!} />
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