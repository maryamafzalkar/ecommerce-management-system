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

const ORDERS_PER_PAGE = 4;

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] =
    useState<number | null>(null);

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
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      setError(
        `Failed to load orders. Status: ${status ?? "Network Error"}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="my-orders">
        <p role="status">Loading orders...</p>
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visibleOrders = orders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

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
        visibleOrders.map((order) => {
          const expanded = expandedOrderId === order.id;

          return (
            <article key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order.id}</h3>

                  <p>
                    Date:{" "}
                    {new Date(order.orderDate).toLocaleDateString()}
                  </p>

                  <p>
                    Items:{" "}
                    {order.items.reduce(
                      (total, item) => total + item.quantity,
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

              <div className="order-summary">
                <span>Order Total</span>
                <strong>${order.totalAmount.toFixed(2)}</strong>
              </div>

              <button
                type="button"
                className="order-details-btn"
                aria-expanded={expanded}
                aria-controls={`my-order-details-${order.id}`}
                onClick={() =>
                  setExpandedOrderId(expanded ? null : order.id)
                }
              >
                {expanded ? "Hide Details" : "View Details"}
              </button>

              {expanded && (
                <div
                  id={`my-order-details-${order.id}`}
                  className="order-details"
                >
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
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })
      )}

      {orders.length > ORDERS_PER_PAGE && (
        <nav className="pagination" aria-label="My order pages">
          <button
            type="button"
            className="secondary-button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>

          <span aria-live="polite">
            Page {currentPage} of {pageCount}
          </span>

          <button
            type="button"
            className="secondary-button"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
