import { FC } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, Trash2, MoreVertical, FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface Props {
  invoice: any;
  onView: () => void;
  onDelete: (id: string) => void;
  calculateTotal: (inv: any) => number;
  onMoveToSpace?: (spaceId: string | null) => void;
  spaces?: Array<{ id: string; name: string; color: string }>;
}

export const InvoiceCard: FC<Props> = ({ 
  invoice, 
  onView, 
  onDelete, 
  calculateTotal,
  onMoveToSpace,
  spaces = []
}) => {
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Card className="hover:shadow-lg transition-all cursor-pointer border hover:border-primary/30 group">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <CardTitle className="text-lg font-semibold truncate flex-1" onClick={onView}>
            {invoice.data.invoiceNumber}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onMoveToSpace && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput className="h-4 w-4 mr-2" />
                    Move to Space
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {invoice.space_id && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onMoveToSpace(null);
                      }}>
                        Remove from Space
                      </DropdownMenuItem>
                    )}
                    {spaces.map((space) => (
                      <DropdownMenuItem
                        key={space.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToSpace(space.id);
                        }}
                        disabled={invoice.space_id === space.id}
                      >
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: space.color }}
                        />
                        {space.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(invoice.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
