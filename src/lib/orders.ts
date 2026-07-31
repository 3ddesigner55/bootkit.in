import type { BootkitOrder } from "@/types/order";

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