import { useEffect, useState } from "react";
import api from "./api";

type OrderItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

type Order = {
  id: number;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Order[]>("/Orders")
      .then((response) => {
        setOrders(response.data);
      })
      .catch(() => {
        setError("Failed to load orders.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>My Orders</h2>

      {orders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id}>
            <h3>Order #{order.id}</h3>

            <p>
              Date: {new Date(order.orderDate).toLocaleDateString()}
            </p>

            <p>Status: {order.status}</p>
            <p>Total: ${order.totalAmount.toFixed(2)}</p>

            <h4>Items</h4>

            {order.items.map((item) => (
              <p key={item.productId}>
                Product #{item.productId} —
                Quantity: {item.quantity} —
                Unit Price: ${item.unitPrice.toFixed(2)}
              </p>
            ))}

            <hr />
          </div>
        ))
      )}
    </div>
  );
}