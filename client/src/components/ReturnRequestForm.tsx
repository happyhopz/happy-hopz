import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Package, RotateCcw, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.happyhopz.com/api';

interface OrderItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size: string;
    color: string;
}

interface Order {
    id: string;
    total: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
    address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
    };
}

interface ReturnRequestFormProps {
    order: Order;
    onSuccess?: () => void;
}

const RETURN_REASONS = [
    'Wrong size received',
    'Product different from description',
    'Manufacturing defect',
    'Damaged during shipping',
    'Changed my mind',
    'Found better price elsewhere',
    'Quality not as expected',
    'Other'
];

export default function ReturnRequestForm({ order, onSuccess }: ReturnRequestFormProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [itemReasons, setItemReasons] = useState<Record<string, string>>({});
    const [comments, setComments] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');

    useEffect(() => {
        // Pre-fill pickup address from order
        if (order.address) {
            const addr = `${order.address.line1}, ${order.address.line2 || ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`;
            setPickupAddress(addr);
        }
    }, [order]);

    const toggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
            const newReasons = { ...itemReasons };
            delete newReasons[itemId];
            setItemReasons(newReasons);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const setItemReason = (itemId: string, reason: string) => {
        setItemReasons({ ...itemReasons, [itemId]: reason });
    };

    const calculateTotal = () => {
        let total = 0;
        order.items.forEach(item => {
            if (selectedItems.has(item.id)) {
                total += item.price * item.quantity;
            }
        });
        return total;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedItems.size === 0) {
            toast.error('Please select at least one item to return');
            return;
        }

        // Validate reasons
        for (const itemId of selectedItems) {
            if (!itemReasons[itemId]) {
                toast.error('Please select a reason for all selected items');
                return;
            }
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const items = Array.from(selectedItems).map(itemId => {
                const orderItem = order.items.find(i => i.id === itemId)!;
                return {
                    orderItemId: itemId,
                    quantity: orderItem.quantity,
                    reason: itemReasons[itemId],
                    condition: 'UNUSED'
                };
            });

            const response = await axios.post(
                `${API_URL}/returns/create`,
                {
                    orderId: order.id,
                    type,
                    items,
                    comments,
                    pickupAddress
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast.success(response.data.message || 'Return request created successfully!');

            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/my-returns');
            }

        } catch (error: any) {
            console.error('Return request error:', error);
            toast.error(error.response?.data?.error || 'Failed to create return request');
        } finally {
            setLoading(false);
        }
    };

    const itemsTotal = calculateTotal();
    const pickupCharge = type === 'RETURN' ? 50 : 0;
    const refundAmount = type === 'RETURN' ? itemsTotal - pickupCharge : 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Return Type Selection */}
            <Card className="p-6">
                <h3 className="text-lg font-fredoka font-bold mb-4">Select Return Type</h3>
                <RadioGroup value={type} onValueChange={(value) => setType(value as 'RETURN' | 'EXCHANGE')}>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="RETURN" id="return" />
                        <Label htmlFor="return" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-primary" />
                                <div>
                                    <div className="font-semibold">Return for Refund</div>
                                    <div className="text-sm text-muted-foreground">
                                        Get refund (₹50 pickup charge will be deducted)
                                    </div>
                                </div>
                            </div>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent mt-3">
                        <RadioGroupItem value="EXCHANGE" id="exchange" />
                        <Label htmlFor="exchange" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <RotateCcw className="w-5 h-5 text-primary" />
                                <div>
                                    <div className="font-semibold">Exchange</div>
                                    <div className="text-sm text-muted-foreground">
                                        Exchange for different size/color (Free delivery)
                                    </div>
                                </div>
                            </div>
                        </Label>
                    </div>
                </RadioGroup>
            </Card>

            {/* Select Items */}
            <Card className="p-6">
                <h3 className="text-lg font-fredoka font-bold mb-4">Select Items to {type === 'RETURN' ? 'Return' : 'Exchange'}</h3>
                <div className="space-y-4">
                    {order.items.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex items-start gap-4">
                                <Checkbox
                                    checked={selectedItems.has(item.id)}
                                    onCheckedChange={() => toggleItem(item.id)}
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold">{item.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                                    </p>
                                    <p className="text-sm font-semibold mt-1">₹{item.price}</p>

                                    {selectedItems.has(item.id) && (
                                        <div className="mt-3">
                                            <Label className="text-sm">Reason for {type === 'RETURN' ? 'return' : 'exchange'}</Label>
                                            <select
                                                value={itemReasons[item.id] || ''}
                                                onChange={(e) => setItemReason(item.id, e.target.value)}
                                                className="w-full mt-1 p-2 border rounded-md"
                                                required
                                            >
                                                <option value="">Select a reason</option>
                                                {RETURN_REASONS.map((reason) => (
                                                    <option key={reason} value={reason}>{reason}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Additional Comments */}
            <Card className="p-6">
                <h3 className="text-lg font-fredoka font-bold mb-4">Additional Comments (Optional)</h3>
                <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Any additional details about your return/exchange..."
                    rows={4}
                />
            </Card>

            {/* Pickup Address */}
            <Card className="p-6">
                <h3 className="text-lg font-fredoka font-bold mb-4">Pickup Address</h3>
                <Textarea
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Enter pickup address..."
                    rows={3}
                    required
                />
            </Card>

            {/* Pricing Summary */}
            {selectedItems.size > 0 && (
                <Card className="p-6 bg-gradient-to-br from-pink-50 to-cyan-50">
                    <h3 className="text-lg font-fredoka font-bold mb-4">Summary</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Items Total:</span>
                            <span className="font-semibold">₹{itemsTotal}</span>
                        </div>
                        {type === 'RETURN' && (
                            <>
                                <div className="flex justify-between text-red-600">
                                    <span>Pickup Charge:</span>
                                    <span className="font-semibold">- ₹{pickupCharge}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Refund Amount:</span>
                                    <span className="text-primary">₹{refundAmount}</span>
                                </div>
                            </>
                        )}
                        {type === 'EXCHANGE' && (
                            <div className="flex items-center gap-2 text-green-600 font-semibold">
                                <AlertCircle className="w-4 h-4" />
                                <span>Free delivery for exchange</span>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={loading || selectedItems.size === 0}
                    className="flex-1"
                >
                    {loading ? 'Submitting...' : (
                        <>
                            Submit {type === 'RETURN' ? 'Return' : 'Exchange'} Request
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
