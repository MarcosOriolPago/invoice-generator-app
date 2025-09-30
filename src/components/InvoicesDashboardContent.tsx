import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { InvoiceCard } from "@/components/InvoiceCard"
import { InvoiceToolbar } from "@/components/InvoiceToolbar"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export const InvoicesDashboardContent = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("date")

  // confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteInvoice, setConfirmDeleteInvoice] = useState<any | null>(null)
  const [confirmInput, setConfirmInput] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user) fetchInvoices()
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

    console.log("Active session:", session)

    if (!session) {
      console.warn("No active session → queries will be anonymous!")
      return
    }

    // 2. Fetch without filtering first (helpful for debugging RLS)
    const { data: allInvoices, error: fetchAllError } = await supabase
      .from("invoices")
      .select("*")

    if (fetchAllError) {
      console.error("Error fetching ALL invoices:", fetchAllError)
    } else {
      console.log("All invoices in DB:", allInvoices)
    }

    // 3. Fetch filtered by logged-in user (this is what the UI needs)
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching invoices for user:", error)
      return
    }

    console.log("Invoices for this user:", data)
    setInvoices(data || [])
  }

  // open confirmation modal (double-check): require exact invoice number typed
  const requestDelete = (invoice: any) => {
    setConfirmDeleteId(invoice.id)
    setConfirmDeleteInvoice(invoice)
    setConfirmInput("")
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) {
      setConfirmOpen(false)
      return
    }

    setIsDeleting(true)

    // ensure session user id is used for ownership check
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error fetching session:", sessionError)
      setIsDeleting(false)
      return
    }

    const userId = session?.user?.id ?? user?.id
    if (!userId) {
      console.error("No user id available to perform delete")
      setIsDeleting(false)
      return
    }

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
      return
    }

    // remove locally for immediate UI feedback
    setInvoices((prev) => prev.filter((inv) => inv.id !== confirmDeleteId))
    setConfirmDeleteId(null)
    setConfirmDeleteInvoice(null)
    setConfirmInput("")
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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invoice Dashboard</h1>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <Button onClick={() => navigate("/invoice-generator")} className="flex gap-2">
          <Plus className="w-4 h-4" /> New Invoice
        </Button>
      </div>

      <InvoiceToolbar search={search} setSearch={setSearch} sort={sort} setSort={setSort} />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {/* Confirm delete dialog (double-check) */}
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
