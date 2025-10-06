import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceData } from '@/components/InvoiceForm';

export const generatePDF = async (
  invoiceElement: HTMLElement,
  data: InvoiceData
): Promise<void> => {
  try {
    // Render element to canvas
    const canvas = await html2canvas(invoiceElement, {
      scale: 4,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: invoiceElement.scrollWidth,
      windowHeight: invoiceElement.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('[data-invoice-preview]');
        if (clonedElement) {
          (clonedElement as HTMLElement).style.borderRadius = '0';
          (clonedElement as HTMLElement).style.border = 'none';
        }
      }
    });

    const pdfWidth = 210; // A4 width mm
    const pdfHeight = 297; // A4 height mm
    const marginTop = 15;
    const marginBottom = 20;
    const contentHeight = pdfHeight - marginTop - marginBottom;
    const imgWidth = pdfWidth - 20; // 10mm margin left/right
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      precision: 12
    });

    const pageHeightPx = (contentHeight * canvas.width) / imgWidth; // content area in canvas px
    let position = 0;
    let pageNumber = 1;

    while (position < canvas.height) {
      const canvasPage = document.createElement('canvas');
      canvasPage.width = canvas.width;
      canvasPage.height = Math.min(pageHeightPx, canvas.height - position);

      const ctx = canvasPage.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          position,
          canvas.width,
          canvasPage.height,
          0,
          0,
          canvas.width,
          canvasPage.height
        );
      }

      const imgData = canvasPage.toDataURL('image/png', 1.0);

      if (pageNumber > 1) {
        pdf.addPage();
        pdf.addImage(
          imgData,
          'PNG',
          10,
          marginTop,
          imgWidth,
          (canvasPage.height * imgWidth) / canvas.width,
          '',
          'FAST'
        );
      } else {
        // first page → no extra vertical offset
        pdf.addImage(
          imgData,
          'PNG',
          10,
          0,
          imgWidth,
          (canvasPage.height * imgWidth) / canvas.width,
          '',
          'FAST'
        );
      }

      // Page number footer
      pdf.setFontSize(9);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${pageNumber}`,
        pdfWidth / 2,
        pdfHeight - 10,
        { align: 'center' }
      );

      position += pageHeightPx;
      pageNumber++;
    }

    const filename = `invoice-${data.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};
