import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceData } from '@/components/InvoiceForm';

export const generatePDF = async (invoiceElement: HTMLElement, data: InvoiceData): Promise<void> => {
  try {
    // Create canvas from HTML element with high quality settings
    const canvas = await html2canvas(invoiceElement, {
      scale: 4, // Much higher scale for crisp quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      logging: false,
      letterRendering: true,
      windowWidth: invoiceElement.scrollWidth,
      windowHeight: invoiceElement.scrollHeight,
      x: 0,
      y: 0,
      width: invoiceElement.scrollWidth,
      height: invoiceElement.scrollHeight,
    });

    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF with high quality settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false, // Disable compression for better quality
      precision: 16 // Higher precision
    });
    let position = 0;

    // Convert canvas to high quality JPEG
    const imgData = canvas.toDataURL('image/jpeg', 0.98); // High quality JPEG
    
    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= pageHeight;
    }

    // Generate filename
    const filename = `invoice-${data.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    
    // Download PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};