import React from 'react';
import { ArrowLeft, Printer, Share2, Download } from 'lucide-react';

/**
 * InvoiceTemplate Component
 * 
 * A professional invoice template based on the Figma design
 * Used for PDF generation and printing - matches the A4 format design
 */
const InvoiceTemplate = React.memo(({ orderData, orderStatus, onClose }) => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const expectedDate = new Date();
  expectedDate.setDate(expectedDate.getDate() + 14);
  const expectedDateStr = expectedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short', 
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger print dialog for saving as PDF
    window.print();
  };

  const handleShare = () => {
    const invoiceText = `
🧾 INVOICE - Order #${orderData.id}

📅 Invoice Date: ${currentDate}
📅 Expected Date: ${expectedDateStr}

👤 CUSTOMER DETAILS:
• Full Name: ${orderData.customer.name}
• Email: ${orderData.customer.email}
• Phone: ${orderData.customer.phone}

📦 ORDER INFORMATION:
• Shipping: ${orderData.orderInfo.shipping}
• Payment Method: ${orderData.orderInfo.paymentMethod}
• Status: ${orderStatus}

🏠 DELIVERY ADDRESS:
${orderData.deliveryAddress}

📄 DOCUMENTS SUBMITTED:
${orderData.documents.name}

💰 ORDER SUMMARY:
• Sub Total: ₹${orderData.summary.subTotal}
• Shipping Rate: ₹${orderData.summary.shippingRate}
• Promo: ₹${orderData.summary.promo}
• Points: ₹${orderData.summary.points}
• TOTAL: ₹${orderData.summary.total}

© 2025 YORAA. All rights reserved.
Thank you for your business!
    `.trim();
    
    if (navigator.share) {
      navigator.share({
        title: `Invoice - Order #${orderData.id}`,
        text: invoiceText,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(invoiceText)
        .then(() => alert('Invoice details copied to clipboard!'))
        .catch(() => alert('Unable to copy invoice details.'));
    }
  };

  return (
    <div className="bg-white w-full max-w-4xl mx-auto p-8 print:p-6 print:shadow-none shadow-lg font-sans">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onClose}
            className="print:hidden flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-normal text-gray-700">Invoice</h1>
        </div>
        
        <div className="flex items-center space-x-4 print:hidden">
          <button 
            onClick={handlePrint}
            className="bg-gray-100 p-3 rounded-lg hover:bg-gray-200"
          >
            <Printer className="h-6 w-6 text-gray-600" />
          </button>
          <button 
            onClick={handleShare}
            className="p-3 hover:bg-gray-100 rounded-lg"
          >
            <Share2 className="h-6 w-6 text-gray-600" />  
          </button>
          <button 
            onClick={handleDownload}
            className="p-3 hover:bg-gray-100 rounded-lg"
          >
            <Download className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Invoice Details Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left Side - Invoice From & To */}
        <div className="space-y-6">
          {/* Invoice From */}
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">Invoice From :</h3>
            <div className="space-y-1">
              <p className="text-base font-bold text-gray-700">Virginia Walker</p>
              <p className="text-sm font-semibold text-gray-600">9694 Krajcik Locks Suite 635</p>
            </div>
          </div>

          {/* Invoice To */}
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">Invoice To :</h3>
          </div>
        </div>

        {/* Right Side - Dates */}
        <div className="text-right space-y-2">
          <p className="text-base font-semibold text-gray-700">Invoice Date : {currentDate}</p>
          <p className="text-base font-semibold text-gray-700">expected Date : {expectedDateStr}</p>
        </div>
      </div>

      {/* Customer Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 pb-6 border-b border-gray-200">
        {/* Billed To */}
        <div>
          <h4 className="text-lg font-bold text-gray-800 mb-3">billed to</h4>
          <div className="space-y-1 text-base text-gray-600">
            <p>Full Name: {orderData.customer.name}</p>
            <p>Email: {orderData.customer.email}</p>
            <p>Phone: {orderData.customer.phone}</p>
          </div>
        </div>

        {/* Deliver To */}
        <div>
          <h4 className="text-lg font-bold text-gray-800 mb-3">Deliver to</h4>
          <div className="text-base font-semibold text-gray-600">
            <p>Address: {orderData.deliveryAddress}</p>
          </div>
        </div>

        {/* Order Info */}
        <div>
          <h4 className="text-lg font-bold text-gray-800 mb-3">Order Info</h4>
          <div className="space-y-1 text-base font-semibold text-gray-600">
            <p>Shipping: {orderData.orderInfo.shipping}</p>
            <p>Payment Method: {orderData.orderInfo.paymentMethod}</p>
            <p>Status: {orderStatus}</p>
          </div>
        </div>

        {/* Documents Submitted */}
        <div>
          <h4 className="text-lg font-bold text-gray-800 mb-3">documents submitted</h4>
          <div className="space-y-1 text-base text-gray-600">
            <p>document name</p>
            <p>{orderData.documents.name}</p>
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="mb-8">
        {/* Table Header */}
        <div className="grid grid-cols-9 gap-4 py-4 border-b border-gray-200 text-sm font-bold text-gray-800">
          <div>order id</div>
          <div>date</div>
          <div className="text-center">customer name</div>
          <div>size</div>
          <div>quantity</div>
          <div>SKU</div>
          <div>barcode no.</div>
          <div>Price</div>
          <div>sale price</div>
        </div>

        {/* Table Rows */}
        {orderData.items.map((item, index) => (
          <div key={index} className="grid grid-cols-9 gap-4 py-4 border-b border-gray-100 text-lg font-medium">
            <div className="text-blue-600 underline">{item.id}</div>
            <div className="text-gray-900">{item.date}</div>
            <div className="text-gray-900 text-center">{item.customerName}</div>
            <div className="text-gray-900">{item.size}</div>
            <div className="text-gray-900">{item.quantity}</div>
            <div className="text-gray-900">{item.sku}</div>
            <div className="text-gray-900">{item.barcode}</div>
            <div className="text-gray-900">₹{item.price}</div>
            <div className="text-gray-900">₹{item.salePrice}</div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="flex justify-end mb-8">
        <div className="space-y-3">
          <div className="flex justify-between text-lg font-bold text-gray-600 min-w-[300px]">
            <span>Sub Total</span>
            <span className="text-gray-900">₹{orderData.summary.subTotal}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-600">
            <span>Shipping Rate</span>
            <span className="text-gray-900">₹{orderData.summary.shippingRate}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-600">
            <span>Promo</span>
            <span className="text-gray-900">₹{orderData.summary.promo}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-600">
            <span>Points</span>
            <span className="text-gray-900">₹{orderData.summary.points}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-600 pt-3 border-t border-gray-200">
            <span>Total</span>
            <span className="text-gray-900">₹{orderData.summary.total}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
        <p>© 2025 YORAA. All rights reserved.</p>
        <p className="mt-1">Thank you for your business!</p>
      </div>

      <style jsx="true">{`
        @media print {
          @page { 
            size: A4; 
            margin: 0.5in; 
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; 
          }
          * { 
            -webkit-print-color-adjust: exact !important; 
            color-adjust: exact !important; 
          }
        }
      `}</style>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
