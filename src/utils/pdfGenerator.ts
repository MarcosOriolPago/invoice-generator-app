import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceData } from '@/components/InvoiceForm';

export const generatePDF = async (invoiceElement: HTMLElement, data: InvoiceData): Promise<void> => {
  try {
    // Create canvas from HTML element with very high quality settings for SVG clarity
    const canvas = await html2canvas(invoiceElement, {
      scale: 4, // Higher scale for better quality
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
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('[data-invoice-preview]');
        if (clonedElement) {
          // Remove any rounded borders for PDF
          (clonedElement as HTMLElement).style.borderRadius = '0';
          (clonedElement as HTMLElement).style.border = 'none';
        }
      }
    });

    // PDF settings with 1-inch (25.4mm) margins
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const margin = 25.4; // 1 inch margins
    const contentWidth = pdfWidth - (2 * margin);
    const contentHeight = pdfHeight - (2 * margin) - 10; // Reserve space for page number
    
    // Calculate scaled dimensions
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      precision: 16
    });

    // Use PNG for better quality (especially for SVG elements)
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    let heightLeft = imgHeight;
    let position = 0;
    let pageNumber = 1;

    // Add first page with margins
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight, '', 'FAST');
    
    // Add page number
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Page ${pageNumber}`, pdfWidth / 2, pdfHeight - 15, { align: 'center' });
    
    heightLeft -= contentHeight;

    // Add additional pages if needed with proper content flow
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pageNumber++;
      
      pdf.addImage(imgData, 'PNG', margin, position + margin, imgWidth, imgHeight, '', 'FAST');
      
      // Add page number
      pdf.setFontSize(9);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Page ${pageNumber}`, pdfWidth / 2, pdfHeight - 15, { align: 'center' });
      
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