import { useEffect, useState } from "react";
import axios from "axios";
import api from "./api";

type OrderItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
};

type AdminOrder = {
  id: number;
  customerId: number;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
};

const nextStatuses: Record<string, string> = {
  Pending: "Processing",
  Processing: "Shipped",
  Shipped: "Delivered",
};

function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      try {
        const response = await api.get<AdminOrder[]>("/admin/orders");

        if (active) {
          setOrders(response.data);
        }
      } catch (err) {
        if (!active) return;

        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setError("Only admins can view all orders.");
        } else if (
          axios.isAxiosError(err) &&
          err.response?.status === 401
        ) {
          setError("Your session has expired. Please log in again.");
        } else {
          setError("Failed to load orders. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      active = false;
    };
  }, []);

  const handleUpdateStatus = async (order: AdminOrder) => {
    const nextStatus = nextStatuses[order.status];

    if (!nextStatus || updatingId !== null) return;

    const confirmed = window.confirm(
      `Change order #${order.id} to ${nextStatus}?`
    );

    if (!confirmed) return;

    setUpdatingId(order.id);
    setUpdateError("");

    try {
      const response = await api.patch<{ id: number; status: string }>(
        `/admin/orders/${order.id}/status`,
        { status: nextStatus }
      );

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? { ...currentOrder, status: response.data.status }
            : currentOrder
        )
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setUpdateError("Your session has expired. Please log in again.");
        } else if (err.response?.status === 403) {
          setUpdateError("Only admins can update order status.");
        } else if (typeof err.response?.data === "string") {
          setUpdateError(err.response.data);
        } else {
          setUpdateError("Failed to update order status. Please try again.");
        }
      } else {
        setUpdateError("Failed to update order status. Please try again.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p role="status">Loading orders...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h2>All Orders</h2>

      {updateError && <p role="alert">{updateError}</p>}

      {orders.length === 0 && <p>No orders found.</p>}

      {orders.map((order) => (
        <article className="orders-card" key={order.id}>
          <h3>Order #{order.id}</h3>

          <p>Customer ID: {order.customerId}</p>
          <p>Date: {new Date(order.orderDate).toLocaleString()}</p>
          <p>Status: {order.status}</p>
          <p>Total: ${order.totalAmount.toFixed(2)}</p>

          {nextStatuses[order.status] && (
            <button
              type="button"
              disabled={updatingId !== null}
              onClick={() => void handleUpdateStatus(order)}
            >
              {updatingId === order.id
                ? "Updating..."
                : `Mark as ${nextStatuses[order.status]}`}
            </button>
          )}

          <ul>
            {order.items.map((item, index) => (
              <li key={`${order.id}-${item.productId}-${index}`}>
                {item.productName} — Quantity: {item.quantity}
                {" | "}Unit price: ${item.unitPrice.toFixed(2)}
                {" | "}Subtotal: $
                {(item.quantity * item.unitPrice).toFixed(2)}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

export default AdminOrders;