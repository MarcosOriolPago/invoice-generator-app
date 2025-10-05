import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Calendar, ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
// Assuming recharts is available for data visualization
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Header } from '@/components/Header'; // Imported Header
import { UserSettingsDialog } from '@/components/UserSettingsDialog'; // Imported UserSettingsDialog


interface InvoiceRecord {
  id: string;
  created_at: string;
  data: any;
}

interface EarningsDataPoint {
  date: string; // YYYY-MM-DD
  total: number;
}

/**
 * Helper function to calculate the total amount of an invoice
 * (Copied from InvoicesDashboardContent for consistency)
 */
const calculateInvoiceTotal = (invoice: any) => {
  const services =
    (invoice?.data?.services ?? invoice?.data?.services_list ?? invoice?.data?.services) || [];

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
  );
};

/**
 * Aggregates invoice data into daily earnings
 */
const aggregateEarnings = (invoices: InvoiceRecord[]): EarningsDataPoint[] => {
  const dailyEarningsMap = new Map<string, number>();

  invoices.forEach((invoice) => {
    const total = calculateInvoiceTotal(invoice);
    // Use the invoice date for aggregation, falling back to created_at date part
    const date = invoice.data.invoiceDate || invoice.created_at.split('T')[0]; 
    
    const existingTotal = dailyEarningsMap.get(date) || 0;
    dailyEarningsMap.set(date, existingTotal + total);
  });

  // Convert map to array and sort by date
  const aggregatedData = Array.from(dailyEarningsMap.entries())
    .map(([date, total]) => ({ date, total: parseFloat(total.toFixed(2)) }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return aggregatedData;
};

export const InsightsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  // State for settings dialog, copied from InvoiceGenerator.tsx
  const [showSettings, setShowSettings] = useState(false); 
  // Default start date: 3 months ago
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  // Default end date: today
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user && startDate && endDate) {
      fetchInvoicesByDateRange();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startDate, endDate]);

  const fetchInvoicesByDateRange = async () => {
    if (!user) return;
    setLoading(true);
    
    // Ensure session is available for RLS
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? user?.id;

    if (!userId) {
      setLoading(false);
      toast.error("Authentication required to fetch data.");
      return;
    }

    // Basic date validation
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        // Filter by invoice date field (assuming it's consistently named 'invoiceDate' in the JSON 'data' column)
        .gte('data->>invoiceDate', startDate) 
        .lte('data->>invoiceDate', endDate)
        .order('data->>invoiceDate', { ascending: true });

      if (error) {
        throw new Error("Failed to fetch earnings data.");
      }

      setInvoices(data as InvoiceRecord[]);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load insights data.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = aggregateEarnings(invoices);
  const totalEarnings = chartData.reduce((sum, dp) => sum + dp.total, 0);

  return (
    // Applied min-h-screen bg-background wrapper and Header/Dialog
    <div className="min-h-screen bg-background">
      <Header onOpenSettings={() => setShowSettings(true)} />
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-7xl">

          {/* Content Centering Wrapper */}
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Earnings Insights</h1>
            <p className="text-muted-foreground mb-8">
              Visualize your invoice earnings over time.
            </p>

            {/* Date Range Selector and Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-professional">Filter Period</CardTitle>
                <CardDescription>Select a date range to view earnings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <Card className="p-3 bg-primary/10 border-primary/30">
                      <p className="text-sm font-medium text-primary">Total Earnings</p>
                      <p className="text-2xl font-bold text-primary">${totalEarnings.toFixed(2)}</p>
                      <p className="text-xs text-primary/70">{startDate} to {endDate}</p>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-professional">Daily Earnings Trend</CardTitle>
                <CardDescription>Aggregate earnings by invoice date within the selected range.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis
                          tickFormatter={(value) => `$${value}`}
                          stroke="#6b7280"
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                          labelFormatter={(label) => `Date: ${label}`}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', padding: '10px' }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          name="Daily Earnings"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-20">
                      <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No earnings data found for this period.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Include UserSettingsDialog */}
      <UserSettingsDialog 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  );
};
