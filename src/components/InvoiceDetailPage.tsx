import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Download, FileWarning } from 'lucide-react';
import { toast } from 'sonner';

// Define the expected invoice structure including the new pdf_path
interface InvoiceRecord {
  id: string;
  created_at: string;
  user_id: string;
  data: any; // The JSON data of the invoice
  pdf_path: string | null; // The public URL to the generated PDF
}

export const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchInvoice();
    } else if (!id) {
        setLoading(false);
        toast.error("Invalid invoice ID.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

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
        // Select all columns and the new pdf_path
        .select('id, created_at, user_id, data, pdf_path') 
        .eq('id', id)
        .eq('user_id', userId) // RLS check for ownership
        .single();

      if (error || !data) {
        throw new Error("Invoice not found or access denied.");
      }

      setInvoice(data as InvoiceRecord);
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold truncate">Invoice #{invoice.data.invoiceNumber}</h1>
        {invoice.pdf_path ? (
          <a href={invoice.pdf_path} target="_blank" rel="noopener noreferrer" download>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </a>
        ) : (
          <Button disabled variant="secondary" className="cursor-not-allowed">
            <FileWarning className="h-4 w-4 mr-2 text-yellow-600" />
            PDF Missing
          </Button>
        )}
      </div>

      <div className="p-0 bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
        {invoice.pdf_path ? (
          <div className="relative w-full aspect-[3/4] max-h-[80vh]">
            {/* Display the PDF in an iframe. Using a safe aspect ratio. */}
            <iframe
              src={invoice.pdf_path}
              title={`Invoice ${invoice.data.invoiceNumber} PDF Preview`}
              className="w-full h-full"
              frameBorder="0"
              style={{ minHeight: '600px' }}
            >
              <p>Your browser does not support iframes. <a href={invoice.pdf_path}>Download the PDF instead.</a></p>
            </iframe>
          </div>
        ) : (
          <div className="text-center py-20 border-dashed border-gray-300">
            <FileWarning className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">PDF file not found for this invoice. It may have been generated before this feature was enabled.</p>
          </div>
        )}
      </div>
    </div>
  );
};
