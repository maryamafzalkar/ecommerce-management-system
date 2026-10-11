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

function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <p role="status">Loading orders...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (orders.length === 0) return <p>No orders found.</p>;

  return (
    <div>
      <h2>All Orders</h2>

      {orders.map((order) => (
        <article className="orders-card" key={order.id}>
          <h3>Order #{order.id}</h3>

          <p>Customer ID: {order.customerId}</p>
          <p>Date: {new Date(order.orderDate).toLocaleString()}</p>
          <p>Status: {order.status}</p>
          <p>Total: ${order.totalAmount.toFixed(2)}</p>

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