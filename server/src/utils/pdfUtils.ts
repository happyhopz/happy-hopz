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
        startY: 85,
        head: [['Product', 'Size', 'Color', 'Qty', 'Price', 'Total']],
        body: tableData,
        headStyles: { fillColor: [255, 107, 107] },
        theme: 'striped'
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`₹${(order.subtotal || 0).toFixed(2)}`, 180, finalY, { align: 'right' });

    doc.text(`Tax (GST):`, 140, finalY + 5);
    doc.text(`₹${(order.tax || 0).toFixed(2)}`, 180, finalY + 5, { align: 'right' });

    doc.text(`Shipping:`, 140, finalY + 10);
    doc.text(`₹${(order.shipping || 0).toFixed(2)}`, 180, finalY + 10, { align: 'right' });

    if (order.couponDiscount > 0) {
        doc.setTextColor(34, 197, 94); // Green
        doc.text(`Discount (${order.couponCode}):`, 140, finalY + 15);
        doc.text(`-₹${order.couponDiscount.toFixed(2)}`, 180, finalY + 15, { align: 'right' });
        doc.setTextColor(0);
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total:`, 140, finalY + 25);
    doc.text(`₹${order.total.toFixed(2)}`, 180, finalY + 25, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('This is a computer generated invoice and does not require a physical signature.', 105, 280, { align: 'center' });
    doc.text('Thank you for shopping with Happy Hopz!', 105, 285, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
};
