
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface SplitOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  orderItems: any[];
  onSplit: (splitData: any) => void;
}

export function SplitOrderModal({
  isOpen,
  onClose,
  order,
  orderItems,
  onSplit,
}: SplitOrderModalProps) {
  const { t } = useTranslation();
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [currentOrderItems, setCurrentOrderItems] = useState<any[]>([]);

  useEffect(() => {
    if (orderItems && orderItems.length > 0) {
      setCurrentOrderItems(
        orderItems.map((item) => ({
          ...item,
          remainingQuantity: item.quantity,
        }))
      );
    }
  }, [orderItems]);

  useEffect(() => {
    if (order) {
      const orderNum = order.orderNumber || `ORD-${order.id}`;
      setNewOrders([{ name: `${orderNum}.1`, items: [] }]);
    }
  }, [order]);

  const addNewOrder = () => {
    const orderNum = order?.orderNumber || `ORD-${order?.id}`;
    setNewOrders([
      ...newOrders,
      { name: `${orderNum}.${newOrders.length + 1}`, items: [] },
    ]);
  };

  const removeOrder = (index: number) => {
    if (newOrders.length > 1) {
      const removed = newOrders[index];
      // Return items back to current order
      const updatedCurrent = [...currentOrderItems];
      removed.items.forEach((item: any) => {
        const currentItem = updatedCurrent.find((i) => i.id === item.id);
        if (currentItem) {
          currentItem.remainingQuantity += item.quantity;
        }
      });
      setCurrentOrderItems(updatedCurrent);
      setNewOrders(newOrders.filter((_, i) => i !== index));
    }
  };

  const moveItemToNewOrder = (item: any, newOrderIndex: number, quantity: number) => {
    // Validate quantity
    if (quantity <= 0) {
      console.warn('Cannot move 0 or negative quantity');
      return;
    }
    
    if (quantity > item.remainingQuantity) {
      console.warn(`Cannot move ${quantity}, only ${item.remainingQuantity} remaining`);
      return;
    }

    const updatedCurrent = currentOrderItems.map((i) =>
      i.id === item.id ? { ...i, remainingQuantity: i.remainingQuantity - quantity } : i
    );
    setCurrentOrderItems(updatedCurrent);

    const updatedNewOrders = [...newOrders];
    const existingItem = updatedNewOrders[newOrderIndex].items.find((i: any) => i.id === item.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = (parseFloat(existingItem.unitPrice) * existingItem.quantity).toString();
    } else {
      updatedNewOrders[newOrderIndex].items.push({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: quantity,
        total: (parseFloat(item.unitPrice) * quantity).toString(),
      });
    }
    setNewOrders(updatedNewOrders);
  };

  const removeItemFromNewOrder = (newOrderIndex: number, itemId: number, quantity: number) => {
    const updatedCurrent = currentOrderItems.map((i) =>
      i.id === itemId ? { ...i, remainingQuantity: i.remainingQuantity + quantity } : i
    );
    setCurrentOrderItems(updatedCurrent);

    const updatedNewOrders = [...newOrders];
    updatedNewOrders[newOrderIndex].items = updatedNewOrders[newOrderIndex].items
      .map((i: any) => {
        if (i.id === itemId) {
          const newQty = i.quantity - quantity;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      })
      .filter(Boolean);
    setNewOrders(updatedNewOrders);
  };

  const handleSplit = () => {
    const splitData = newOrders
      .filter((order) => order.items.length > 0)
      .map((order) => ({
        name: order.name,
        items: order.items,
        tableId: null,
      }));

    onSplit({ 
      originalOrderId: order.id, 
      items: splitData,
      tableId: order.tableNumber 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Tách order - Order {order?.orderNumber || `ORD-${order?.id}`} - Bàn {order?.tableNumber || "N/A"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Left: Current Order Items */}
          <div className="border rounded-lg p-4">
            <h3 className="font-bold mb-4 text-lg">
              Order {order?.orderNumber || `ORD-${order?.id}`} - Bàn {order?.tableNumber || "N/A"}
              <span className="ml-2 text-sm text-gray-500">({order?.customerCount || 0} người)</span>
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 font-bold text-sm bg-gray-100 p-2 rounded">
                <div className="col-span-5">Tên món</div>
                <div className="col-span-2 text-center">SL</div>
                <div className="col-span-3 text-right">Tổng tiền</div>
                <div className="col-span-2"></div>
              </div>
              {currentOrderItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm border-b pb-2">
                  <div className="col-span-5">{item.productName}</div>
                  <div className="col-span-2 text-center">{item.remainingQuantity}</div>
                  <div className="col-span-3 text-right">
                    {formatCurrency(parseFloat(item.unitPrice) * item.remainingQuantity)}
                  </div>
                  <div className="col-span-2 flex gap-1 justify-end">
                    {newOrders.map((_, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="outline"
                        onClick={() => moveItemToNewOrder(item, idx, 1)}
                        disabled={item.remainingQuantity === 0}
                        className="h-6 w-6 p-0"
                      >
                        →
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: New Orders */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Tách mới món thành {newOrders.length} order</h3>
              <Button onClick={addNewOrder} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm order
              </Button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {newOrders.map((newOrder, orderIdx) => (
                <div key={orderIdx} className="border rounded-lg p-3 bg-blue-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-blue-700">{newOrder.name}</h4>
                    {newOrders.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOrder(orderIdx)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold bg-blue-100 p-1 rounded">
                      <div className="col-span-5">Tên món</div>
                      <div className="col-span-3 text-right">Tổng tiền</div>
                      <div className="col-span-4 text-center">SL Tách</div>
                    </div>
                    {newOrder.items.length === 0 ? (
                      <div className="text-center text-gray-400 py-4 text-sm">
                        Chưa có món nào
                      </div>
                    ) : (
                      newOrder.items.map((item: any) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm bg-white p-2 rounded">
                          <div className="col-span-5">{item.productName}</div>
                          <div className="col-span-3 text-right">
                            {formatCurrency(parseFloat(item.unitPrice) * item.quantity)}
                          </div>
                          <div className="col-span-4 flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItemFromNewOrder(orderIdx, item.id, 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const currentItem = currentOrderItems.find(i => i.id === item.id);
                                if (currentItem && currentItem.remainingQuantity > 0) {
                                  moveItemToNewOrder(currentItem, orderIdx, 1);
                                }
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItemFromNewOrder(orderIdx, item.id, item.quantity)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSplit}
            disabled={!newOrders.some((o) => o.items.length > 0)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Đồng ý
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
