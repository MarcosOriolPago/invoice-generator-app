import { forwardRef } from "react";
import { InvoiceData } from "./InvoiceForm";

interface UserConfig {
  company_name?: string;
  company_address?: string;
  company_email?: string;
  company_phone?: string;
  company_website?: string;
  tax_number?: string;
  bank_details?: string;
  default_payment_terms?: string;
  default_currency?: string;
  tax_rate?: number;
  irpf_rate?: number;
}

interface InvoicePreviewProps {
  data: InvoiceData;
  userConfig: UserConfig | null;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data, userConfig  }, ref) => {
    const calculateServiceTotal = (service) => {
      const subtaskHours = service.subtasks?.reduce(
        (sum, sub) => sum + sub.hours,
        0
      ) || 0;
      return subtaskHours * service.rate;
    };

    const subtotal = data.services.reduce(
      (sum, service) => sum + calculateServiceTotal(service),
      0
    );

    const taxRate = data.taxRate ?? userConfig?.tax_rate ?? 21;
    const irpfRate = data.irpfRate ?? userConfig?.irpf_rate ?? 15;
    
    const irpfAmount = subtotal * (irpfRate / 100);
    const afterIrpf = subtotal - irpfAmount;
    const taxAmount = afterIrpf * (taxRate / 100);
    const total = afterIrpf + taxAmount;
    
    // Get currency symbol from user config, default to USD
    const getCurrencySymbol = (currency: string | undefined) => {
      const currencyMap: { [key: string]: string } = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
        'CHF': 'CHF',
        'CNY': '¥',
        'SEK': 'kr',
        'NOK': 'kr',
        'MXN': '$',
        'INR': '₹',
        'BRL': 'R$',
      };
      return currencyMap[currency || 'USD'] || currency || '$';
    };
    
    const currencySymbol = getCurrencySymbol(userConfig?.default_currency);

    return (
      <div
        ref={ref}
        data-invoice-preview
        className="bg-white p-10 shadow-xl max-w-4xl mx-auto rounded-lg border border-gray-200"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-10 pb-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <img src="/logo_mop_clean.svg" alt="Logo" className="h-16 w-16" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Marcos Solutions</h1>
                {userConfig?.company_name && userConfig.company_name !== 'Marcos Solutions' && (
                  <p className="text-lg text-gray-700">{userConfig.company_name}</p>
                )}
              </div>
            </div>
            {userConfig?.company_address && (
              <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">{userConfig.company_address}</p>
            )}
            <div className="text-sm text-gray-600 space-y-1">
              {userConfig?.company_email && <p>Email: {userConfig.company_email}</p>}
              {userConfig?.company_phone && <p>Phone: {userConfig.company_phone}</p>}
              {userConfig?.company_website && <p>Web: {userConfig.company_website}</p>}
              {userConfig?.tax_number && <p>Tax ID: {userConfig.tax_number}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 uppercase mb-1">Invoice Number</p>
              <p className="text-2xl font-bold text-blue-600">{data.invoiceNumber}</p>
            </div>
          </div>
        </div>

        { /* Billing Info */}
        <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Bill To</h2>
                {data.clientName && <p className="font-bold text-gray-900 text-lg mb-2">{data.clientName}</p>}
                {data.clientAddress && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line leading-relaxed">{data.clientAddress}</p>}
                {data.clientEmail && <p className="text-sm text-gray-600 mt-2">Email: {data.clientEmail}</p>}
            </div>
            <div className="text-right space-y-2">
                <div>
                    <p className="text-xs text-gray-500 uppercase">Invoice Date</p>
                    <p className="font-semibold text-gray-900">
                        {new Date(data.invoiceDate).toISOString().split("T")[0]}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase">Due Date</p>
                    <p className="font-semibold text-gray-900">
                        {new Date(data.dueDate).toISOString().split("T")[0]}
                    </p>
                </div>
                {userConfig?.default_payment_terms && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Payment Terms</p>
                    <p className="font-semibold text-gray-900">{userConfig.default_payment_terms}</p>
                  </div>
                )}
            </div>
        </div>

        {/* Services */}
        <div className="mb-10">
          {data.services.map((service, idx) => (
            <div
              key={idx}
              className="mb-8 border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {service.title}
                  </h3>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Rate</p>
                  <p className="font-semibold text-gray-900">
                    {currencySymbol}{service.rate.toFixed(2)}/hr
                  </p>
                </div>
              </div>

              {/* Subtasks */}
              {service.subtasks && service.subtasks.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {service.subtasks.map((subtask, sIdx) => (
                    <div
                      key={sIdx}
                      className="px-6 py-3 grid grid-cols-12 gap-4 items-center"
                    >
                      <div className="col-span-6">
                        <p className="font-medium text-gray-800">
                          {subtask.title}
                        </p>
                        {subtask.description && (
                          <p className="text-sm text-gray-500">
                            {subtask.description}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 text-center text-gray-700">
                        {subtask.hours}
                      </div>
                      <div className="col-span-2 text-center text-gray-700">
                        {currencySymbol}{service.rate.toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right font-semibold text-gray-900">
                        {currencySymbol}{(subtask.hours * service.rate).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Service Total */}
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-200">
                <span className="text-sm font-medium text-gray-600">
                  Service Total
                </span>
                <span className="text-base font-bold text-gray-900">
                  {currencySymbol}{calculateServiceTotal(service).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-10">
          <div className="w-72">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">
                  {currencySymbol}{subtotal.toFixed(2)}
                </span>
              </div>
              {irpfRate > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">IRPF ({irpfRate}%):</span>
                  <span className="font-semibold text-red-600">-{currencySymbol}{irpfAmount.toFixed(2)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">IVA ({taxRate}%):</span>
                  <span className="font-semibold">+{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  {currencySymbol}{total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Payment Info */}
        <div className="border-t-2 border-gray-200 pt-6 space-y-6">
          {data.notes && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{data.notes}</p>
            </div>
          )}
          
          {userConfig?.bank_details && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Payment Information</h4>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{userConfig.bank_details}</p>
            </div>
          )}
          
          <div className="text-center text-xs text-gray-500 pt-4">
            <p>Thank you for your business!</p>
            {userConfig?.company_website && (
              <p className="mt-1">{userConfig.company_website}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";
