import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { UserSettingsDialog } from "@/components/UserSettingsDialog";
import { InvoiceCard } from "@/components/InvoiceCard";
import { ArrowLeft, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface Space {
  id: string;
  name: string;
  description?: string | null;
  color: string;
}

export const SpaceView = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [space, setSpace] = useState<Space | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user && spaceId) {
      fetchSpace();
      fetchInvoices();
    }
  }, [user, spaceId]);

  const fetchSpace = async () => {
    try {
      const { data, error } = await supabase
        .from("invoice_spaces")
        .select("*")
        .eq("id", spaceId)
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      setSpace(data);
    } catch (error) {
      console.error("Error fetching space:", error);
      toast.error("Failed to load space");
      navigate("/");
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user!.id)
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
      toast.success("Invoice deleted");
      fetchInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const handleMoveToSpace = async (invoiceId: string, newSpaceId: string | null) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ space_id: newSpaceId })
        .eq("id", invoiceId)
        .eq("user_id", user!.id);

      if (error) throw error;
      toast.success(newSpaceId ? "Invoice moved" : "Invoice removed from space");
      fetchInvoices();
    } catch (error) {
      console.error("Error moving invoice:", error);
      toast.error("Failed to move invoice");
    }
  };

  if (loading || !space) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenSettings={() => setShowSettings(true)} />
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="mb-8 flex items-start gap-4">
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: `${space.color}20` }}
            >
              <FolderOpen className="h-8 w-8" style={{ color: space.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{space.name}</h1>
              {space.description && (
                <p className="text-muted-foreground">{space.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Invoices Yet</h2>
              <p className="text-muted-foreground mb-6">
                This space is empty. Move invoices here from the dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onView={() => navigate(`/invoice/${invoice.id}`)}
                  onDelete={() => handleDeleteInvoice(invoice.id)}
                  calculateTotal={(inv) => {
                    const subtotal = inv.data.services?.reduce(
                      (sum: number, service: any) => {
                        const subtaskHours = service.subtasks?.reduce(
                          (s: number, sub: any) => s + sub.hours,
                          0
                        ) || 0;
                        return sum + subtaskHours * service.rate;
                      },
                      0
                    ) || 0;
                    return subtotal;
                  }}
                  onMoveToSpace={(spaceId) => handleMoveToSpace(invoice.id, spaceId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <UserSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
};
