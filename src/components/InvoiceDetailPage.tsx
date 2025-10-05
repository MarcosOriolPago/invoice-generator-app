import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Download, Edit, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { InvoicePreview } from './InvoicePreview';
import { generatePDF } from '@/utils/pdfGenerator';

interface InvoiceRecord {
  id: string;
  created_at: string;
  user_id: string;
  data: any;
  pdf_path?: string | null;
  space_id?: string | null;
}

export const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [userConfig, setUserConfig] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && id) {
      fetchInvoice();
      fetchUserConfig();
    } else if (!id) {
        setLoading(false);
        toast.error("Invalid invoice ID.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

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

  const fetchInvoice = async () => {
    setLoading(true);
    
    // Ensure session is available for RLS
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? user?.id;

    if (!userId) {
      setLoading(false);
      toast.error("Authentication required to view invoice.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        throw new Error("Invoice not found or access denied.");
      }

      setInvoice(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load invoice details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (!invoice || !previewRef.current) {
      toast.error("No invoice data available");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      await generatePDF(previewRef.current, invoice.data);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEdit = () => {
    navigate(`/invoice-generator?edit=${id}`);
  };

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested invoice could not be loaded.</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold">Invoice #{invoice.data.invoiceNumber}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <InvoicePreview ref={previewRef} data={invoice.data} userConfig={userConfig} />
      </div>
    </div>
  );
};
