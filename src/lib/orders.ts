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

  void saveOrderToDatabase(order);
}

async function saveOrderToDatabase(order: BootkitOrder) {
  try {
    const rawSession = window.localStorage.getItem("bootkit_session_v1");
    const session = rawSession ? JSON.parse(rawSession) : null;
    const token = session?.accessToken;
    if (!token) return;

    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
    const storeId = window.localStorage.getItem("bootkit_store_v1") || undefined;

    await fetch(`${apiBase}/orders/direct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order: {
          ...order,
          storeId,
        },
      }),
    });
  } catch (err) {
    console.error("Failed to save order to MongoDB:", err);
  }
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
