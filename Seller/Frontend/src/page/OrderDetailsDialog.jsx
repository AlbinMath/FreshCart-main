import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/ui/dialog";
import { Badge } from "@/ui/badge";
import { ScrollArea } from "@/ui/scroll-area";
import { Separator } from "@/ui/separator";
import { Package, User, MapPin, CreditCard, Calendar, Truck } from 'lucide-react';
import { format } from 'date-fns';

const OrderDetailsDialog = ({ open, onOpenChange, order }) => {
    if (!order) return null;

    const {
        shippingAddress,
        items,
        status,
        _id,
        createdAt,
        totalAmount,
        paymentMethod,
        userId
    } = order;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b bg-gray-50/50">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Order #{_id.slice(-6).toUpperCase()}
                                <Badge variant="outline" className="text-xs font-normal">
                                    {format(new Date(createdAt), 'PPP p')}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription>
                                Customer ID: <span className="font-mono text-xs">{userId}</span>
                            </DialogDescription>
                        </div>
                        <Badge className={`text-sm px-3 py-1 ${status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                            } border-0`}>
                            {status}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Customer & Shipping Info */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <User className="h-4 w-4" /> Customer Details
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg border space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase">Name</span>
                                    <span className="font-medium">{shippingAddress?.name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase">Shipping Address</span>
                                    <div className="font-medium mt-1">
                                        {shippingAddress?.street && <div className="line-clamp-2">{shippingAddress.street}</div>}
                                        <div>{shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.zipCode}</div>
                                        <div>{shippingAddress?.country}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Status */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Payment Info
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg border space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Payment Method</span>
                                    <span className="font-medium">{paymentMethod}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total Amount</span>
                                    <span className="font-bold text-green-600 text-lg">₹{totalAmount}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-gray-500">Payment Status</span>
                                    <Badge variant="outline" className="bg-white">
                                        {order.paymentStatus || 'Pending'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Order Items */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Package className="h-4 w-4" /> Ordered Items ({items?.length || 0})
                        </h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3 text-right">Price</th>
                                        <th className="px-4 py-3 text-center">Qty</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.productName} className="h-10 w-10 rounded-md object-cover border" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                                                            <Package className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-gray-900">{item.productName}</div>
                                                        <div className="text-xs text-gray-500">ID: {item.productId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">₹{item.price}</td>
                                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right font-medium">₹{item.price * item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t font-semibold">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-right">Grand Total</td>
                                        <td className="px-4 py-3 text-right text-green-600">₹{totalAmount}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </ScrollArea>

                {/* Optional Footer Actions */}
                {/* <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                     Add 'Process Order' buttons here later 
                </div> */}
            </DialogContent>
        </Dialog>
    );
};

export default OrderDetailsDialog;
