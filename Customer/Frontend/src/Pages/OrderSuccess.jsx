import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/apiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DeliveryEstimate from '../components/DeliveryEstimate';

export default function OrderSuccess() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInvoiceBtn, setShowInvoiceBtn] = useState(false);
    const [showCancelBtn, setShowCancelBtn] = useState(false);

    useEffect(() => {
        fetchOrder();

        // Poll for updates every 5 seconds
        const intervalId = setInterval(() => {
            fetchOrder(true); // Silent fetch
        }, 5000);

        return () => clearInterval(intervalId);
    }, [orderId]);

    useEffect(() => {
        if (order) {
            const orderTime = new Date(order.createdAt).getTime();
            const currentTime = Date.now();
            const timeDiff = currentTime - orderTime;

            // Invoke Timer (5 mins)
            const fiveMinutes = 5 * 60 * 1000;
            if (timeDiff < fiveMinutes) {
                setShowInvoiceBtn(true);
                const remainingTime = fiveMinutes - timeDiff;
                const timer = setTimeout(() => setShowInvoiceBtn(false), remainingTime);
                // We can't clear multiple timeouts easily here if we use single var, but cleanups run on re-render.
                // Best to split or just let it run.
            } else {
                setShowInvoiceBtn(false);
            }

            // Cancel Timer (3 mins) - Only if status is 'Placed' or 'Pending'
            const threeMinutes = 3 * 60 * 1000;
            if (timeDiff < threeMinutes && (order.status === 'Placed' || order.status === 'Pending')) {
                setShowCancelBtn(true);
                const remainingTime = threeMinutes - timeDiff;
                const timer = setTimeout(() => setShowCancelBtn(false), remainingTime);
            } else {
                setShowCancelBtn(false);
            }
        }
    }, [order]);

    const handleCancelOrder = async () => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;

        try {
            const response = await apiService.put('/payment/cancel-order', { orderId: order._id });
            if (response.success) {
                alert("Order cancelled successfully");
                fetchOrder(); // Refresh order details
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error("Cancellation failed", error);
            alert("Failed to cancel order");
        }
    };

    const fetchOrder = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            // We need an endpoint to get order details. 
            // Reuse public or payment route? Let's assume we add one to paymentRoutes or reuse.
            // For now, I will implement a fetch from paymentRoutes.
            const response = await apiService.get(`/payment/order/${orderId}`);
            if (response.success) {
                setOrder(response.order);
            }
        } catch (error) {
            console.error("Failed to fetch order", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const downloadInvoice = () => {
        if (!order) return;

        try {
            const doc = new jsPDF();
            const invoiceId = order.orderId || order.razorpayOrderId || order._id.toString().slice(-6).toUpperCase();
            const brandColor = [22, 163, 74]; // Green-600

            // -- Header Background --
            doc.setFillColor(...brandColor);
            doc.rect(0, 0, 210, 40, 'F');

            // -- Title & Company --
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.text("FreshCart", 14, 25);

            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.text("INVOICE", 180, 25, { align: 'right' });

            // Reset Text Color
            doc.setTextColor(0, 0, 0);

            // -- Order & Date Details (Right Side) --
            doc.setFontSize(10);
            const detailX = 140;
            let detailY = 50;

            doc.setFont('helvetica', 'bold');
            doc.text("Invoice Details", detailX, detailY);
            detailY += 6;

            doc.setFont('helvetica', 'normal');
            doc.text(`Invoice No: ${invoiceId}`, detailX, detailY);
            detailY += 5;
            doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, detailX, detailY);
            detailY += 5;
            doc.text(`Payment: ${order.paymentMethod || 'Online'} (${order.paymentStatus})`, detailX, detailY);

            // -- Bill To Address (Left Side) --
            let addressY = 50;
            doc.setFont('helvetica', 'bold');
            doc.text("Bill To:", 14, addressY);
            addressY += 6;

            doc.setFont('helvetica', 'normal');
            if (order.shippingAddress) {
                const { name, houseNumber, street, city, state, zipCode } = order.shippingAddress;

                doc.text(`${name || 'Customer'}`, 14, addressY);
                addressY += 5;

                const addressLine1 = [houseNumber, street].filter(Boolean).join(', ');
                doc.text(addressLine1, 14, addressY);
                addressY += 5;

                doc.text(`${city}, ${state} - ${zipCode}`, 14, addressY);
                addressY += 5;
                doc.text(order.shippingAddress.country || 'India', 14, addressY);
            }

            // -- Item Table --
            const tableColumn = ["Item", "Qty", "Price", "Total"];
            const tableRows = [];
            let subtotal = 0;

            order.items.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                tableRows.push([
                    item.productName,
                    item.quantity + (item.unit ? ' ' + item.unit : ''),
                    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price),
                    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(itemTotal)
                ]);
            });

            autoTable(doc, {
                startY: 85,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: {
                    fillColor: brandColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 80 },
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                },
                footStyles: { fillColor: [240, 240, 240] }
            });

            // -- Totals Section --
            const finalY = doc.lastAutoTable.finalY + 10;
            const summaryX = 120;
            const valX = 195;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            let currentY = finalY;

            // Subtotal
            doc.text("Subtotal:", summaryX, currentY);
            doc.text(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(subtotal), valX, currentY, { align: 'right' });
            currentY += 6;

            // Tax Details from taxDetails if available
            if (order.taxDetails && order.taxDetails.breakdown) {
                const taxDetails = order.taxDetails;

                if (taxDetails.breakdown.discountApplied !== undefined && taxDetails.breakdown.discountApplied > 0) {
                    doc.setTextColor(22, 163, 74); // Green color for discount
                    doc.text("Discount (Coupon):", summaryX, currentY);
                    doc.text("- " + new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(taxDetails.breakdown.discountApplied), valX, currentY, { align: 'right' });
                    doc.setTextColor(0, 0, 0); // Reset color
                    currentY += 6;
                }

                // Delivery Fee
                if (taxDetails.breakdown.delivery && taxDetails.breakdown.delivery.value > 0) {
                    doc.text("Delivery Fee:", summaryX, currentY);
                    doc.text(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(taxDetails.breakdown.delivery.value), valX, currentY, { align: 'right' });
                    currentY += 6;
                }

                // Platform Fee
                if (taxDetails.breakdown.platformFee && taxDetails.breakdown.platformFee.value > 0) {
                    doc.text("Platform Fee:", summaryX, currentY);
                    doc.text(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(taxDetails.breakdown.platformFee.value), valX, currentY, { align: 'right' });
                    currentY += 6;
                }

                // CGST
                if (taxDetails.totals && taxDetails.totals.totalCGST) {
                    doc.text("CGST (2.5%):", summaryX, currentY);
                    doc.text(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(taxDetails.totals.totalCGST), valX, currentY, { align: 'right' });
                    currentY += 6;
                }

                // SGST
                if (taxDetails.totals && taxDetails.totals.totalSGST) {
                    doc.text("SGST (2.5%):", summaryX, currentY);
                    doc.text(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(taxDetails.totals.totalSGST), valX, currentY, { align: 'right' });
                    currentY += 6;
                }

                // TCS
                if (taxDetails.breakdown.tcs && taxDetails.breakdown.tcs.amount > 0) {
                    doc.text("TCS (1%):", summaryX, currentY);
                    doc.text(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(taxDetails.breakdown.tcs.amount), valX, currentY, { align: 'right' });
                    currentY += 6;
                }
            } else {
                // Fallback to old calculation if taxDetails not available
                const tax = order.totalAmount - subtotal;
                doc.text("Tax (5%):", summaryX, currentY);
                doc.text(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tax), valX, currentY, { align: 'right' });
                currentY += 6;
            }

            // Divider
            doc.setDrawColor(200, 200, 200);
            doc.line(summaryX, currentY + 2, 200, currentY + 2);
            currentY += 8;

            // Total
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text("Total:", summaryX, currentY);
            doc.text(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount), valX, currentY, { align: 'right' });

            // Footer
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text("Thank you for shopping with FreshCart!", 105, 280, { align: 'center' });
            doc.text("For support: cartfresh44@gmail.com", 105, 285, { align: 'center' });

            doc.save(`FreshCart_Invoice_${invoiceId}.pdf`);
        } catch (error) {
            console.error("Invoice generation failed:", error);
            alert("Failed to generate invoice. Please try again.");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <div className="flex-grow flex items-center justify-center text-center">
                <p>Order not found</p>
                <Link to="/" className="text-green-600 ml-2">Go Home</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-12">

            <div className="container mx-auto px-4 py-8">
                <div className="bg-white max-w-4xl mx-auto p-8 rounded-lg shadow-lg">

                    {/* Success Header */}
                    <div className="text-center mb-8">
                        {order.status?.toLowerCase() === 'cancelled' ? (
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                        <h1 className={`text-2xl font-bold mb-2 ${order.status?.toLowerCase() === 'cancelled' ? 'text-red-700' : 'text-gray-800'}`}>
                            {order.status?.toLowerCase() === 'cancelled' ? 'Order Cancelled' : 'Order Placed Successfully!'}
                        </h1>
                        <p className="text-gray-600">
                            Order ID: <span className="font-mono font-bold text-gray-800">{order.orderId || order.razorpayOrderId || order._id.slice(-6).toUpperCase()}</span>
                        </p>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Shipping Info */}
                        <div className="border p-4 rounded-lg bg-gray-50">
                            <h2 className="font-bold text-gray-800 mb-3 border-b pb-2">Shipping Details</h2>
                            {order.shippingAddress ? (
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p className="font-semibold text-gray-900">{order.shippingAddress.name}</p>
                                    <p>{order.shippingAddress.houseNumber}, {order.shippingAddress.street}</p>
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                                    <p>{order.shippingAddress.country}</p>
                                </div>
                            ) : <p className="text-sm text-gray-500">No address details available</p>}
                        </div>

                        {/* Payment Info */}
                        <div className="border p-4 rounded-lg bg-gray-50">
                            <h2 className="font-bold text-gray-800 mb-3 border-b pb-2">Payment Info</h2>
                            <div className="text-sm text-gray-600 space-y-2">
                                <div className="flex justify-between">
                                    <span>Method:</span>
                                    <span className="font-medium">{order.paymentMethod || 'Online'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Payment Status:</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {order.paymentStatus}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Order Status:</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${order.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        order.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Date:</span>
                                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery OTP Section */}
                    {order.deliveryOtp && order.status?.toLowerCase() !== 'delivered' && (
                        <div className="mb-8 bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                            <h2 className="text-xl font-bold text-green-800 mb-2">Delivery OTP</h2>
                            <p className="text-gray-600 mb-2">Share this OTP with the delivery agent only upon receiving your order.</p>
                            <div className="text-4xl font-mono font-bold text-green-700 tracking-widest bg-white inline-block px-6 py-3 rounded-lg border-2 border-green-300 shadow-sm">
                                {order.deliveryOtp}
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="mb-8">
                        {/* ✅ Estimated Delivery Time */}
                        {order.status?.toLowerCase() !== 'cancelled' && order.status?.toLowerCase() !== 'delivered' && (
                            <div className="mb-6 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                                <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span>🕓</span> Estimated Delivery Time
                                </h2>
                                <DeliveryEstimate
                                    storeAddress={(order.items?.[0] || {}).storeAddress || null}
                                    prepMins={parseFloat((order.items?.[0] || {}).preparationTime) || 0}
                                    savedAddress={order.shippingAddress}
                                />
                            </div>
                        )}

                        <h2 className="font-bold text-xl text-gray-800 mb-4">Order Items</h2>
                        <div className="space-y-4">
                            {(order.items || []).map((item, index) => (
                                <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div className="w-16 h-16 bg-white rounded-md flex-shrink-0 overflow-hidden border">
                                        {item.image ? (
                                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{item.productName}</h3>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity} {item.unit || ''}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800">
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                        <div className="flex flex-col items-end gap-2 text-sm text-gray-600">
                            <div className="w-full md:w-1/3 flex justify-between">
                                <span>Subtotal:</span>
                                <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((order.items || []).reduce((acc, item) => acc + (item.price * item.quantity), 0))}</span>
                            </div>

                            {order.taxDetails && order.taxDetails.breakdown ? (
                                <>
                                    {order.taxDetails.breakdown.discountApplied !== undefined && order.taxDetails.breakdown.discountApplied > 0 && (
                                        <div className="w-full md:w-1/3 flex justify-between text-green-600 font-medium">
                                            <span>Discount (Coupon):</span>
                                            <span>- {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.taxDetails.breakdown.discountApplied)}</span>
                                        </div>
                                    )}
                                    {order.taxDetails.breakdown.delivery && order.taxDetails.breakdown.delivery.value > 0 && (
                                        <div className="w-full md:w-1/3 flex justify-between">
                                            <span>Delivery Fee:</span>
                                            <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.taxDetails.breakdown.delivery.value)}</span>
                                        </div>
                                    )}
                                    {order.taxDetails.breakdown.platformFee && order.taxDetails.breakdown.platformFee.value > 0 && (
                                        <div className="w-full md:w-1/3 flex justify-between">
                                            <span>Platform Fee:</span>
                                            <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.taxDetails.breakdown.platformFee.value)}</span>
                                        </div>
                                    )}
                                    {order.taxDetails.totals && order.taxDetails.totals.totalCGST > 0 && (
                                        <div className="w-full md:w-1/3 flex justify-between">
                                            <span>CGST (2.5%):</span>
                                            <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.taxDetails.totals.totalCGST)}</span>
                                        </div>
                                    )}
                                    {order.taxDetails.totals && order.taxDetails.totals.totalSGST > 0 && (
                                        <div className="w-full md:w-1/3 flex justify-between">
                                            <span>SGST (2.5%):</span>
                                            <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.taxDetails.totals.totalSGST)}</span>
                                        </div>
                                    )}
                                    {order.taxDetails.breakdown.tcs && order.taxDetails.breakdown.tcs.amount > 0 && (
                                        <div className="w-full md:w-1/3 flex justify-between">
                                            <span>TCS (1%):</span>
                                            <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.taxDetails.breakdown.tcs.amount)}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full md:w-1/3 flex justify-between">
                                    <span>Tax (5%):</span>
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount - (order.items || []).reduce((acc, item) => acc + (item.price * item.quantity), 0))}</span>
                                </div>
                            )}

                            <div className="w-full md:w-1/3 flex justify-between font-bold text-lg text-gray-900 border-t pt-2 mt-1">
                                <span>Total:</span>
                                <span className="text-green-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 space-y-4">
                        {showInvoiceBtn && (
                            <button
                                onClick={downloadInvoice}
                                className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-900 transition flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download Invoice
                            </button>
                        )}

                        {showCancelBtn && (
                            <button
                                onClick={handleCancelOrder}
                                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Cancel Order
                            </button>
                        )}

                        {(order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'placed') && (
                            <Link
                                to={`/rate-order/${order._id}`}
                                className="block w-full bg-yellow-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-yellow-600 transition text-center flex items-center justify-center gap-2"
                            >
                                <span className="text-xl">★</span>
                                Rate Experience
                            </Link>
                        )}

                        <Link
                            to="/orders"
                            className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition text-center"
                        >
                            Back to My Orders
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
