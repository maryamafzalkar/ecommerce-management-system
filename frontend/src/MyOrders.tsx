
import { useEffect, useState } from "react";
import api from "./api";

type OrderItem = {
  productId: number;
  productName?: string;
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [expandedOrderId, setExpandedOrderId] =
    useState<number | null>(null);

  // Fetch orders from Render API
  const loadOrders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get<Order[]>("/Orders");

      setOrders(response.data);
    } catch (err: unknown) {
      console.error("Orders API Error:", err);

      const status =
        typeof err === "object" &&
        err !== null &&
        "response" in err
          ? (err as {
              response?: { status?: number };
            }).response?.status
          : undefined;

      setError(
        `Failed to load orders. Status: ${
          status ?? "Network Error"
        }`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load orders when component mounts
  useEffect(() => {
    void loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="my-orders">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="my-orders">
      <h2>My Orders</h2>

      <button
        type="button"
        className="order-details-btn"
        onClick={() => void loadOrders(true)}
        disabled={refreshing}
      >
        {refreshing ? "Refreshing..." : "Refresh Orders"}
      </button>

      {error && <p role="alert">{error}</p>}

      {orders.length === 0 && !error ? (
        <p>You have no orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="order-card">

            {/* Order Header */}
            <div className="order-header">
              <div>
                <h3>Order #{order.id}</h3>

                <p>
                  Date:{" "}
                  {new Date(
                    order.orderDate
                  ).toLocaleDateString()}
                </p>

                <p>
                  Items:{" "}
                  {order.items.reduce(
                    (total, item) =>
                      total + item.quantity,
                    0
                  )}
                </p>
              </div>

              <span
                className={`order-status ${order.status.toLowerCase()}`}
              >
                {order.status}
              </span>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <span>Order Total</span>

              <strong>
                ${order.totalAmount.toFixed(2)}
              </strong>
            </div>

            {/* View Details Button */}
            <button
              type="button"
              className="order-details-btn"
              onClick={() =>
                setExpandedOrderId(
                  expandedOrderId === order.id
                    ? null
                    : order.id
                )
              }
            >
              {expandedOrderId === order.id
                ? "Hide Details"
                : "View Details"}
            </button>

            {/* Conditional Order Details */}
            {expandedOrderId === order.id && (
              <div className="order-details">
                <h4>Order Items</h4>

                {order.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="order-item"
                  >
                    <div>
                      <strong>
                        {item.productName ||
                          `Product #${item.productId}`}
                      </strong>

                      <p>
                        {item.quantity} × $
                        {item.unitPrice.toFixed(2)}
                      </p>
                    </div>

                    <strong>
                      $
                      {(
                        item.quantity * item.unitPrice
                      ).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
