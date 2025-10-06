import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { InvoiceCard } from "@/components/InvoiceCard"
import { InvoiceToolbar } from "@/components/InvoiceToolbar"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CreateSpaceDialog } from "@/components/CreateSpaceDialog"
import { SpaceCard } from "@/components/SpaceCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const InvoicesDashboardContent = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<any[]>([])
  const [spaces, setSpaces] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("date")
  const [showCreateSpace, setShowCreateSpace] = useState(false)

  // confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteInvoice, setConfirmDeleteInvoice] = useState<any | null>(null)
  const [confirmInput, setConfirmInput] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchInvoices()
      fetchSpaces()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchInvoices = async () => {
    // 1. Check session first (use supabase session so we are sure RLS will receive it)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error fetching session:", sessionError)
      return
    }

    if (!session) {
      console.warn("No active session → queries will be anonymous!")
      return
    }

    // 2. Fetch filtered by logged-in user (this is what the UI needs)
    const { data, error } = await supabase
      .from("invoices")
      // Ensure we select the new pdf_path column
      .select("*, pdf_path")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching invoices for user:", error)
      return
    }

    setInvoices(data || [])
  }

  const fetchSpaces = async () => {
    const { data, error } = await supabase
      .from("invoice_spaces")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching spaces:", error)
      return
    }

    // Count invoices in each space
    const spacesWithCounts = await Promise.all(
      (data || []).map(async (space) => {
        const { count } = await supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("space_id", space.id)
          .eq("user_id", user!.id)

        return { ...space, invoice_count: count || 0 }
      })
    )

    setSpaces(spacesWithCounts)
  }

  const handleDeleteSpace = async (spaceId: string) => {
    try {
      const { error } = await supabase
        .from("invoice_spaces")
        .delete()
        .eq("id", spaceId)
        .eq("user_id", user!.id)

      if (error) throw error
      toast.success("Space deleted")
      fetchSpaces()
      fetchInvoices() // Refresh invoices as they might have been moved out
    } catch (error) {
      console.error("Error deleting space:", error)
      toast.error("Failed to delete space")
    }
  }

  const handleMoveToSpace = async (invoiceId: string, spaceId: string | null) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ space_id: spaceId })
        .eq("id", invoiceId)
        .eq("user_id", user!.id)

      if (error) throw error
      toast.success(spaceId ? "Invoice moved to space" : "Invoice removed from space")
      fetchInvoices()
      fetchSpaces()
    } catch (error) {
      console.error("Error moving invoice:", error)
      toast.error("Failed to move invoice")
    }
  }

  // open confirmation modal (double-check): require exact invoice number typed
  const requestDelete = (invoice: any) => {
    setConfirmDeleteId(invoice.id)
    setConfirmDeleteInvoice(invoice)
    setConfirmInput("")
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId || !user) {
      setConfirmOpen(false)
      return
    }

    setIsDeleting(true)
    
    const userId = user.id
    
    // 1. Optional: Delete the PDF file from storage first
    const pdfPath = confirmDeleteInvoice?.pdf_path;
    if (pdfPath && pdfPath.includes('invoices_pdfs/')) {
        try {
            // Extract the path after the bucket name for the Supabase remove function
            const storagePath = pdfPath.split('invoices_pdfs/')[1];
            if (storagePath) {
                const { error: storageError } = await supabase.storage
                    .from('invoices_pdfs')
                    .remove([storagePath]);
                    
                if (storageError) {
                    console.warn("Failed to delete PDF from storage:", storageError);
                    toast.warning("Failed to delete the associated PDF file from storage, but continuing with DB record deletion.");
                }
            }
        } catch (e) {
            console.warn("Error processing PDF path for deletion:", e);
        }
    }

    // 2. Delete the database record
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", confirmDeleteId)
      .eq("user_id", userId)
      .select()

    setIsDeleting(false)
    setConfirmOpen(false)

    if (error) {
      console.error("Error deleting invoice:", error)
      toast.error("Failed to delete invoice from database.");
      return
    }

    // remove locally for immediate UI feedback
    setInvoices((prev) => prev.filter((inv) => inv.id !== confirmDeleteId))
    setConfirmDeleteId(null)
    setConfirmDeleteInvoice(null)
    setConfirmInput("")
    toast.success("Invoice successfully deleted.");
  }

  const calculateInvoiceTotal = (invoice: any) => {
    const services =
      (invoice?.data?.services ?? invoice?.data?.services_list ?? invoice?.data?.services) || []

    return (
      services?.reduce(
        (sum: number, service: any) =>
          sum +
          (service?.subtasks?.reduce(
            (s: number, st: any) => s + (st?.hours ?? 0) * (service?.rate ?? 0),
            0
          ) || 0),
        0
      ) || 0
    )
  }

  // helper that supports camelCase and snake_case keys
  const getField = (invData: any, camel: string, snake: string) => {
    if (!invData) return undefined
    return invData[camel] ?? invData[snake] ?? undefined
  }

  const filteredInvoices = invoices
    .filter((inv) => {
      const client =
        getField(inv?.data, "clientName", "client_name") ??
        getField(inv?.data, "client", "client")
      if (!search) return true
      return (client ?? "")
        .toString()
        .toLowerCase()
        .includes(search.toLowerCase())
    })
    .sort((a, b) => {
      if (sort === "amount") return calculateInvoiceTotal(b) - calculateInvoiceTotal(a)
      if (sort === "client") {
        const aClient =
          (getField(a?.data, "clientName", "client_name") ?? "").toString()
        const bClient =
          (getField(b?.data, "clientName", "client_name") ?? "").toString()
        return aClient.localeCompare(bClient)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // what the user must type to confirm deletion
  const requiredConfirmText =
    getField(confirmDeleteInvoice?.data, "invoiceNumber", "invoice_number") ?? "DELETE"
  const confirmMatch = confirmInput.trim() === `${requiredConfirmText}`

  const freeInvoices = filteredInvoices.filter((inv) => !inv.space_id)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invoice Dashboard</h1>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreateSpace(true)} className="flex gap-2">
            <FolderPlus className="w-4 h-4" /> New Space
          </Button>
          <Button onClick={() => navigate("/invoice-generator")} className="flex gap-2">
            <Plus className="w-4 h-4" /> New Invoice
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="spaces">Spaces ({spaces.length})</TabsTrigger>
          <TabsTrigger value="unorganized">Unorganized ({freeInvoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <InvoiceToolbar search={search} setSearch={setSearch} sort={sort} setSort={setSort} />
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
            <AnimatePresence>
              {filteredInvoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <InvoiceCard
                    invoice={invoice}
                    onView={() => navigate(`/invoice/${invoice.id}`)}
                    onDelete={() => requestDelete(invoice)}
                    calculateTotal={calculateInvoiceTotal}
                    onMoveToSpace={(spaceId) => handleMoveToSpace(invoice.id, spaceId)}
                    onTogglePaymentStatus={async () => {
                      const newStatus = invoice.payment_status === 'paid' ? 'unpaid' : 'paid';
                      const { error } = await supabase
                        .from('invoices')
                        .update({ 
                          payment_status: newStatus,
                          paid_at: newStatus === 'paid' ? new Date().toISOString() : null
                        })
                        .eq('id', invoice.id)
                        .eq('user_id', user!.id);
                      if (error) {
                        toast.error('Failed to update payment status');
                      } else {
                        toast.success(`Invoice marked as ${newStatus}`);
                        fetchInvoices();
                      }
                    }}
                    spaces={spaces}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredInvoices.length === 0 && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-muted-foreground mb-4">No invoices found</p>
              <Button onClick={() => navigate("/invoice-generator")}>
                <Plus className="w-4 h-4 mr-2" /> Create Your First Invoice
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="spaces" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {spaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                onClick={() => navigate(`/space/${space.id}`)}
                onDelete={() => handleDeleteSpace(space.id)}
              />
            ))}
          </div>

          {spaces.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">No spaces created yet</p>
              <Button onClick={() => setShowCreateSpace(true)}>
                <FolderPlus className="w-4 h-4 mr-2" /> Create Your First Space
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unorganized" className="mt-6">
          <InvoiceToolbar search={search} setSearch={setSearch} sort={sort} setSort={setSort} />
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
            <AnimatePresence>
              {freeInvoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <InvoiceCard
                    invoice={invoice}
                    onView={() => navigate(`/invoice/${invoice.id}`)}
                    onDelete={() => requestDelete(invoice)}
                    calculateTotal={calculateInvoiceTotal}
                    onMoveToSpace={(spaceId) => handleMoveToSpace(invoice.id, spaceId)}
                    onTogglePaymentStatus={async () => {
                      const newStatus = invoice.payment_status === 'paid' ? 'unpaid' : 'paid';
                      const { error } = await supabase
                        .from('invoices')
                        .update({ 
                          payment_status: newStatus,
                          paid_at: newStatus === 'paid' ? new Date().toISOString() : null
                        })
                        .eq('id', invoice.id)
                        .eq('user_id', user!.id);
                      if (error) {
                        toast.error('Failed to update payment status');
                      } else {
                        toast.success(`Invoice marked as ${newStatus}`);
                        fetchInvoices();
                      }
                    }}
                    spaces={spaces}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {freeInvoices.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">All invoices are organized in spaces</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm delete dialog (double-check) */}
      <CreateSpaceDialog
        open={showCreateSpace}
        onOpenChange={setShowCreateSpace}
        onSpaceCreated={() => {
          fetchSpaces()
        }}
      />
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteId(null)
            setConfirmDeleteInvoice(null)
            setConfirmInput("")
            setIsDeleting(false)
          }
          setConfirmOpen(open)
        }}
      >
        <DialogContent className="max-w-md">
          <h3 className="text-lg font-semibold mb-2">Confirm delete</h3>
          <p className="text-sm text-muted-foreground mb-4">
            To permanently delete this invoice, type{" "}
            <span className="font-medium">{requiredConfirmText}</span> below and press{" "}
            <strong>Delete</strong>.
          </p>
          {confirmDeleteInvoice?.pdf_path && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <Trash2 className="w-3 h-3"/> This will also delete the saved PDF file.
            </p>
          )}

          <div className="mb-4">
            <Input
              type="text"
              value={confirmInput}
              onChange={(e: any) => setConfirmInput(e.target.value)}
              placeholder={`Type ${requiredConfirmText} to confirm`}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting || !confirmMatch}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
