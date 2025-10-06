import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceData } from '@/components/InvoiceForm';

export const generatePDF = async (invoiceElement: HTMLElement, data: InvoiceData): Promise<void> => {
  try {
    // Create canvas from HTML element with high quality settings
    const canvas = await html2canvas(invoiceElement, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      logging: false,
      windowWidth: invoiceElement.scrollWidth,
      windowHeight: invoiceElement.scrollHeight,
      x: 0,
      y: 0,
      width: invoiceElement.scrollWidth,
      height: invoiceElement.scrollHeight,
    });

    // PDF settings with margins
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const margin = 15; // 15mm margins
    const contentWidth = pdfWidth - (2 * margin);
    const contentHeight = pdfHeight - (2 * margin);
    
    // Calculate scaled dimensions
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false,
      precision: 16
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    let heightLeft = imgHeight;
    let position = 0;
    let pageNumber = 1;

    // Add first page with margins
    pdf.addImage(imgData, 'JPEG', margin, margin + position, imgWidth, imgHeight, '', 'FAST');
    
    // Add page number
    pdf.setFontSize(10);
    pdf.setTextColor(150);
    pdf.text(`Page ${pageNumber}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
    
    heightLeft -= contentHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = -(imgHeight - heightLeft);
      pdf.addPage();
      pageNumber++;
      
      pdf.addImage(imgData, 'JPEG', margin, margin + position, imgWidth, imgHeight, '', 'FAST');
      
      // Add page number
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.text(`Page ${pageNumber}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
      
      heightLeft -= contentHeight;
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