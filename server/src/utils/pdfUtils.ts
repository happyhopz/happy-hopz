import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateOrderPDF = async (order: any) => {
    const doc = new jsPDF() as any;

    // Add Logo or Header
    doc.setFontSize(22);
    doc.setTextColor(255, 107, 107); // Happy Hopz Red/Pink
    doc.text('HAPPY HOPZ', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Where Every Step Is a Happy Hopz', 105, 28, { align: 'center' });

    // Invoice / Receipt Label
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text('TAX INVOICE / RECEIPT', 20, 45);

    // Order info
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.orderId || order.id}`, 20, 55);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 60);
    doc.text(`Payment Method: ${order.paymentMethod || 'Online'}`, 20, 65);
    doc.text(`Transaction ID: ${order.transactionId || 'N/A'}`, 20, 70);

    // Shipping Address
    doc.setFontSize(12);
    doc.text('Shipping Address:', 120, 55);
    doc.setFontSize(10);
    const address = order.address;
    doc.text([
        address.name,
        address.line1,
        address.line2 || '',
        `${address.city}, ${address.state} - ${address.pincode}`,
        `Phone: ${address.phone}`
    ].filter(Boolean), 120, 62);

    // Items Table
    const tableData = order.items.map((item: any) => [
        item.name,
        item.size,
        item.color,
        item.quantity,
        `₹${item.price.toFixed(2)}`,
        `₹${(item.price * item.quantity).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: 75,
        head: [['Product', 'Size', 'Color', 'Qty', 'Price', 'Total']],
        body: tableData,
        headStyles: { fillColor: [255, 107, 107], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        theme: 'striped',
        margin: { top: 10, bottom: 10 }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 8;

    doc.setFontSize(9);
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`₹${(order.subtotal || 0).toFixed(2)}`, 180, finalY, { align: 'right' });

    doc.text(`Tax (GST):`, 140, finalY + 4);
    doc.text(`₹${(order.tax || 0).toFixed(2)}`, 180, finalY + 4, { align: 'right' });

    doc.text(`Shipping:`, 140, finalY + 8);
    doc.text(`₹${(order.shipping || 0).toFixed(2)}`, 180, finalY + 8, { align: 'right' });

    let currentY = finalY + 12;

    if (order.couponDiscount > 0) {
        doc.setTextColor(34, 197, 94); // Green
        doc.text(`Discount (${order.couponCode}):`, 140, currentY);
        doc.text(`-₹${order.couponDiscount.toFixed(2)}`, 180, currentY, { align: 'right' });
        doc.setTextColor(0);
        currentY += 4;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total:`, 140, currentY + 4);
    doc.text(`₹${order.total.toFixed(2)}`, 180, currentY + 4, { align: 'right' });

    // Footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180);
    const pageHeight = doc.internal.pageSize.height;
    doc.text('This is a computer generated invoice and does not require a physical signature.', 105, pageHeight - 15, { align: 'center' });
    doc.text('Thank you for shopping with Happy Hopz!', 105, pageHeight - 10, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
};

export const generateShippingLabelPDF = async (order: any) => {
    // 4x6 inches in points (72 points per inch) => 288x432
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: [288, 432]
    }) as any;

    const margin = 20;
    const width = 288;

    // Header - Brand
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('HAPPY HOPZ', width / 2, 40, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('www.happyhopz.com', width / 2, 52, { align: 'center' });

    // Divider
    doc.setLineWidth(1);
    doc.line(margin, 65, width - margin, 65);

    // Shipping Details Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIP TO:', margin, 85);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const addr = order.address;
    const addressLines = [
        addr.name.toUpperCase(),
        addr.line1,
        addr.line2,
        `${addr.city}, ${addr.state} - ${addr.pincode}`,
        `Phone: ${addr.phone}`
    ].filter(Boolean);

    doc.text(addressLines, margin, 105);

    // Order Info Box
    const boxY = 200;
    doc.setLineWidth(0.5);
    doc.rect(margin, boxY, width - 2 * margin, 80);

    doc.setFontSize(8);
    doc.text('ORDER ID:', margin + 10, boxY + 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(order.orderId || order.id.slice(0, 12), margin + 10, boxY + 40);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('DATE:', margin + 10, boxY + 60);
    doc.text(new Date(order.createdAt).toLocaleDateString(), margin + 40, boxY + 60);

    doc.text('METHOD:', width / 2, boxY + 60);
    doc.text(order.paymentMethod || 'PREPAID', width / 2 + 45, boxY + 60);

    // Items summary
    doc.setFontSize(7);
    const itemsText = order.items.map((i: any) => `${i.quantity}x ${i.name} (${i.size})`).join(', ');
    const splitItems = doc.splitTextToSize(`ITEMS: ${itemsText}`, width - 2 * margin - 20);
    doc.text(splitItems, margin + 10, boxY + 74);

    // Footer / Stylized Barcode Illustration
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STANDARD SHIPPING', width / 2, 330, { align: 'center' });

    // Draw a stylized barcode (array of thin black lines)
    doc.setDrawColor(0);
    doc.setLineWidth(1);
    const barcodeX = margin + 30;
    const barcodeY = 345;
    const barcodeWidth = width - 2 * margin - 60;
    const barcodeHeight = 40;

    for (let i = 0; i < barcodeWidth; i += 2) {
        // Vary line length or skip a few for a "barcode" effect
        const skip = Math.random() > 0.8;
        if (!skip) {
            doc.line(barcodeX + i, barcodeY, barcodeX + i, barcodeY + barcodeHeight);
        }
    }

    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('Generated by Happy Hopz Fulfillment System', width / 2, 415, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
};
