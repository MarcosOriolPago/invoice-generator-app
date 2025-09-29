import { forwardRef } from "react";
import { InvoiceData } from "./InvoiceForm";

interface InvoicePreviewProps {
  data: InvoiceData;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data }, ref) => {
    const calculateSubtotal = () => {
      return data.services.reduce((sum, service) => sum + (service.hours * service.rate), 0);
    };

    const subtotal = calculateSubtotal();
    const tax = 0; // You can add tax calculation here if needed
    const total = subtotal + tax;

    return (
      <div ref={ref} className="bg-white p-8 shadow-lg max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
            <div className="text-gray-600">
              <p className="font-semibold">{data.businessName}</p>
              <div className="whitespace-pre-line text-sm mt-1">
                {data.businessAddress}
              </div>
              {data.businessPhone && (
                <p className="text-sm mt-1">{data.businessPhone}</p>
              )}
              <p className="text-sm mt-1">{data.businessEmail}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="text-xl font-bold text-blue-600">{data.invoiceNumber}</p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
            <div className="text-gray-700">
              <p className="font-semibold">{data.clientName}</p>
              <div className="whitespace-pre-line text-sm mt-1">
                {data.clientAddress}
              </div>
              <p className="text-sm mt-1">{data.clientEmail}</p>
            </div>
          </div>
          <div className="text-right md:text-left">
            <div className="space-y-2">
              <div className="flex justify-between md:justify-start md:gap-8">
                <span className="text-gray-600">Invoice Date:</span>
                <span className="font-semibold">{new Date(data.invoiceDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between md:justify-start md:gap-8">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-semibold">{new Date(data.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 font-semibold text-gray-900">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Hours</div>
                <div className="col-span-2 text-center">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {data.services.map((service, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-900">{service.description}</div>
                    <div className="col-span-2 text-center text-gray-700">{service.hours}</div>
                    <div className="col-span-2 text-center text-gray-700">${service.rate.toFixed(2)}</div>
                    <div className="col-span-2 text-right font-semibold text-gray-900">
                      ${(service.hours * service.rate).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total Section */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-blue-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 mt-8 text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";