import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Building, Mail, Phone, Globe, Hash, CreditCard, Calendar } from 'lucide-react';

interface UserConfig {
  company_name: string;
  company_address: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  tax_number: string;
  bank_details: string;
  default_payment_terms: string;
  default_currency: string;
}

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserSettingsDialog = ({ open, onOpenChange }: UserSettingsDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<UserConfig>({
    company_name: '',
    company_address: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    tax_number: '',
    bank_details: '',
    default_payment_terms: '30 days',
    default_currency: 'USD',
  });

  useEffect(() => {
    if (open && user) {
      fetchUserConfig();
    }
  }, [open, user]);

  const fetchUserConfig = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_invoice_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        toast.error('Failed to load settings');
        return;
      }

      if (data) {
        setConfig({
          company_name: data.company_name || '',
          company_address: data.company_address || '',
          company_email: data.company_email || '',
          company_phone: data.company_phone || '',
          company_website: data.company_website || '',
          tax_number: data.tax_number || '',
          bank_details: data.bank_details || '',
          default_payment_terms: data.default_payment_terms || '30 days',
          default_currency: data.default_currency || 'USD',
        });
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_invoice_configs')
        .upsert({
          user_id: user.id,
          ...config,
        });

      if (error) {
        toast.error('Failed to save settings');
        return;
      }

      toast.success('Settings saved successfully!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof UserConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Settings</DialogTitle>
          <DialogDescription>
            Configure your default company information for invoices
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company_name">Company Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company_name"
                  value={config.company_name}
                  onChange={(e) => updateConfig('company_name', e.target.value)}
                  className="pl-10"
                  placeholder="Your Company Name"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company_address">Company Address</Label>
              <Textarea
                id="company_address"
                value={config.company_address}
                onChange={(e) => updateConfig('company_address', e.target.value)}
                placeholder="Your company address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company_email">Company Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_email"
                    type="email"
                    value={config.company_email}
                    onChange={(e) => updateConfig('company_email', e.target.value)}
                    className="pl-10"
                    placeholder="company@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company_phone">Company Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_phone"
                    value={config.company_phone}
                    onChange={(e) => updateConfig('company_phone', e.target.value)}
                    className="pl-10"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company_website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company_website"
                  value={config.company_website}
                  onChange={(e) => updateConfig('company_website', e.target.value)}
                  className="pl-10"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tax_number">Tax Number / VAT ID</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tax_number"
                  value={config.tax_number}
                  onChange={(e) => updateConfig('tax_number', e.target.value)}
                  className="pl-10"
                  placeholder="Tax identification number"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bank_details">Bank Details</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="bank_details"
                  value={config.bank_details}
                  onChange={(e) => updateConfig('bank_details', e.target.value)}
                  placeholder="Bank name, account number, routing number, etc."
                  rows={3}
                  className="pl-10 pt-3"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="default_payment_terms">Default Payment Terms</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="default_payment_terms"
                    value={config.default_payment_terms}
                    onChange={(e) => updateConfig('default_payment_terms', e.target.value)}
                    className="pl-10"
                    placeholder="30 days"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="default_currency">Default Currency</Label>
                <Input
                  id="default_currency"
                  value={config.default_currency}
                  onChange={(e) => updateConfig('default_currency', e.target.value)}
                  placeholder="USD"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};