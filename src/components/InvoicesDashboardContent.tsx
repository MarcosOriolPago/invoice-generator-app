import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { InvoicePreview } from "@/components/InvoicePreview"

export const InvoicesDashboardContent = () => {
  const { user } = useAuth()
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

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Your Invoices</h1>

      {invoices.length === 0 ? (
        <p className="text-gray-500">No invoices created yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {invoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {invoice.data.invoiceNumber}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 font-medium">
                  Total: $
                  {invoice.data.services
                    .reduce(
                      (sum, service) =>
                        sum +
                        service.subtasks?.reduce(
                          (s, st) => s + st.hours * service.rate,
                          0
                        ),
                      0
                    )
                    .toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Date: {new Date(invoice.data.invoiceDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Due: {new Date(invoice.data.dueDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
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
