import { FC } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  search: string;
  setSearch: (val: string) => void;
  sort: string;
  setSort: (val: string) => void;
}

export const InvoiceToolbar: FC<Props> = ({ search, setSearch, sort, setSort }) => {
  return (
    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
      <Input
        placeholder="Search by client..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 min-w-[200px]"
      />
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Date</SelectItem>
          <SelectItem value="amount">Amount</SelectItem>
          <SelectItem value="client">Client</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
