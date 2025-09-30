import { FC } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  invoice: any;
  onView: () => void;
  onDelete: (id: string) => void;
  calculateTotal: (inv: any) => number;
}

export const InvoiceCard: FC<Props> = ({ invoice, onView, onDelete, calculateTotal }) => {
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Card className="hover:shadow-lg transition-all cursor-pointer border hover:border-primary/30">
        <CardHeader className="pb-2 flex justify-between items-start">
          <CardTitle className="text-lg font-semibold truncate">{invoice.data.invoiceNumber}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Are you sure you want to delete this invoice?")) onDelete(invoice.id);
            }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2" onClick={onView}>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-success" />
            <span className="font-bold text-success">${calculateTotal(invoice).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="w-4 h-4" />
            <span>{new Date(invoice.data.invoiceDate).toLocaleDateString()}</span>
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {invoice.data.services?.map((s: any) => s.title).join(", ")}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
