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

const ORDERS_PER_PAGE = 4;

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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

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

  const pageCount = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visibleOrders = orders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  return (
    <div className="admin-orders">
      <div className="section-heading">
        <div>
          <h2>Orders</h2>
          <p>Review purchases and manage order status.</p>
        </div>

        <span className="admin-order-count">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </span>
      </div>

      {updateError && <p role="alert">{updateError}</p>}

      {orders.length === 0 && (
        <p className="empty-message">No orders found.</p>
      )}

      <div className="admin-orders-list">
        {visibleOrders.map((order) => {
          const expanded = expandedId === order.id;
          const nextStatus = nextStatuses[order.status];

          return (
            <article className="admin-order-card" key={order.id}>
              <header className="admin-order-header">
                <div>
                  <h3>Order #{order.id}</h3>
                  <p>
                    <time dateTime={order.orderDate}>
                      {new Date(order.orderDate).toLocaleString()}
                    </time>
                  </p>
                </div>

                <span
                  className={`order-status ${order.status.toLowerCase()}`}
                >
                  {order.status}
                </span>
              </header>

              <div className="admin-order-summary">
                <p>
                  Customer #{order.customerId}
                  <span aria-hidden="true"> · </span>
                  {order.items.length}{" "}
                  {order.items.length === 1 ? "item" : "items"}
                </p>

                <strong>${order.totalAmount.toFixed(2)}</strong>
              </div>

              <div className="admin-order-actions">
                <button
                  type="button"
                  className="secondary-button"
                  aria-expanded={expanded}
                  aria-controls={`admin-order-details-${order.id}`}
                  aria-label={`${
                    expanded ? "Hide" : "View"
                  } details for order ${order.id}`}
                  onClick={() =>
                    setExpandedId(expanded ? null : order.id)
                  }
                >
                  {expanded ? "Hide Details" : "View Details"}
                </button>

                {nextStatus && (
                  <button
                    type="button"
                    className="primary-button"
                    disabled={updatingId !== null}
                    onClick={() => void handleUpdateStatus(order)}
                  >
                    {updatingId === order.id
                      ? "Updating..."
                      : `Mark as ${nextStatus}`}
                  </button>
                )}
              </div>

              <div
                id={`admin-order-details-${order.id}`}
                className="admin-order-details"
                hidden={!expanded}
              >
                <h4>Order Items</h4>

                <ul className="admin-order-items">
                  {order.items.map((item, index) => (
                    <li
                      className="admin-order-item"
                      key={`${order.id}-${item.productId}-${index}`}
                    >
                      <div>
                        <strong>{item.productName}</strong>
                        <p>
                          {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>

                      <strong>
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      {orders.length > ORDERS_PER_PAGE && (
        <nav className="pagination" aria-label="Order pages">
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

export default AdminOrders;