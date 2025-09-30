import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { InvoicePreview } from "@/components/InvoicePreview"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Calendar, DollarSign } from "lucide-react"

export const InvoicesDashboardContent = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)

  useEffect(() => {
    if (user) fetchInvoices()
  }, [user])

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching invoices:", error)
      return
    }
    setInvoices(data || [])
  }

  const calculateInvoiceTotal = (invoice: any) => {
    return invoice.data.services?.reduce(
      (sum: number, service: any) =>
        sum +
        (service.subtasks?.reduce(
          (s: number, st: any) => s + st.hours * service.rate,
          0
        ) || 0),
      0
    ) || 0
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-professional mb-2">Invoice Dashboard</h1>
        <p className="text-muted-foreground">Manage and track your invoices</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Create New Invoice Card */}
        <Card 
          className="border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer group"
          onClick={() => navigate("/invoice-generator")}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
            <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Create New Invoice</h3>
            <p className="text-sm text-muted-foreground">Generate a new professional invoice</p>
          </CardContent>
        </Card>

        {/* Invoice Cards */}
        {invoices.map((invoice) => (
          <Card
            key={invoice.id}
            className="hover:shadow-lg transition-all cursor-pointer border hover:border-primary/30"
            onClick={() => setSelectedInvoice(invoice)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-semibold truncate">
                    {invoice.data.invoiceNumber}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-success" />
                <span className="font-bold text-success text-lg">
                  ${calculateInvoiceTotal(invoice).toFixed(2)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Issued: {new Date(invoice.data.invoiceDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(invoice.data.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              {invoice.data.clientName && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-professional">
                    {invoice.data.clientName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {invoices.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first invoice to get started with professional billing
            </p>
            <Button 
              onClick={() => navigate("/invoice-generator")}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Invoice
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-5xl">
          {selectedInvoice && <InvoicePreview data={selectedInvoice.data} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
