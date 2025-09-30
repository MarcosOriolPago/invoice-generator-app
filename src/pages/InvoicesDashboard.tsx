import { useState } from "react"
import { Header } from "@/components/Header"
import { InvoicesDashboardContent } from "@/components/InvoicesDashboardContent"
import { UserSettingsDialog } from "@/components/UserSettingsDialog"

export const InvoicesDashboard = () => {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onOpenSettings={() => setShowSettings(true)} />
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Your dashboard content */}
          <InvoicesDashboardContent />
        </div>
      </div>

      <UserSettingsDialog 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  )
}