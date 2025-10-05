import { Folder, MoreVertical, Trash2, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SpaceCardProps {
  space: {
    id: string;
    name: string;
    description?: string | null;
    color: string;
    invoice_count?: number;
  };
  onClick: () => void;
  onDelete: () => void;
}

export const SpaceCard = ({ space, onClick, onDelete }: SpaceCardProps) => {
  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${space.color}20` }}
          >
            <Folder className="h-6 w-6" style={{ color: space.color }} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Space
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h3 className="font-semibold text-lg mb-1">{space.name}</h3>
        {space.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {space.description}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {space.invoice_count || 0} invoice{space.invoice_count !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
};
