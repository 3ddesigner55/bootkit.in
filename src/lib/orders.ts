import type { BootkitOrder } from "@/types/order";
import { supabase } from "@/lib/supabase/client";

const ORDER_STORAGE_KEY = "bootkit_orders_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `BK${timestamp}${random}`;
}

export function getStoredOrders(): BootkitOrder[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed as BootkitOrder[];
  } catch {
    return [];
  }
}

export function saveOrder(order: BootkitOrder) {
  if (!isBrowser()) return;

  const currentOrders = getStoredOrders();
  const updatedOrders = [order, ...currentOrders];

  window.localStorage.setItem(
    ORDER_STORAGE_KEY,
    JSON.stringify(updatedOrders)
  );

  if (supabase) void saveOrderToDatabase(order);
}

async function saveOrderToDatabase(order: BootkitOrder) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: savedOrder, error } = await supabase.from("orders").insert({
    order_number: order.orderNumber,
    customer_id: user.id,
    status: order.status.replaceAll(" ", "_").toUpperCase(),
    payment_status: order.paymentStatus.toUpperCase(),
    subtotal: order.itemTotal,
    delivery_fee: order.deliveryFee,
    discount: order.offerDiscount || 0,
    total_amount: order.totalAmount,
    address: order.address,
  }).select("id").single();
  if (error || !savedOrder) return;
  await supabase.from("order_items").insert(order.items.map((item) => ({
    order_id: savedOrder.id,
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    unit_price: item.product.price,
    total_price: item.product.price * item.quantity,
  })));
}

export function getOrderByNumber(orderNumber: string) {
  return getStoredOrders().find(
    (order) => order.orderNumber === orderNumber
  );
}
export function updateStoredOrder(
  orderNumber: string,
  updater: (order: BootkitOrder) => BootkitOrder
) {
  if (!isBrowser()) return null;

  const orders = getStoredOrders();
  let updatedOrder: BootkitOrder | null = null;

  const updatedOrders = orders.map((order) => {
    if (order.orderNumber !== orderNumber) {
      return order;
    }

    updatedOrder = updater(order);
    return updatedOrder;
  });

  window.localStorage.setItem(
    ORDER_STORAGE_KEY,
    JSON.stringify(updatedOrders)
  );

  return updatedOrder;
}

export function cancelStoredOrder(orderNumber: string) {
  return updateStoredOrder(orderNumber, (order) => ({
    ...order,
    status: "Cancelled",
    updatedAt: new Date().toISOString(),
  }));
}
