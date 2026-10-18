import { useEffect, useRef, useState } from "react";
import axios from "axios";
import api from "./api";

type CartItem = {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product: {
    name: string;
  };
};

type CartResponse = {
  items: CartItem[];
  total: number;
};

type CartProps = {
  refreshKey?: number;
  cartBusy: boolean;
  beginCartOperation: () => boolean;
  endCartOperation: () => void;
};

function getCheckoutStorageKey(): string {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please log in again.");
  }

  const tokenPart = token.split(".")[1];

  if (!tokenPart) {
    throw new Error("Please log in again.");
  }

  const encodedPayload = tokenPart
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const payload = JSON.parse(
    atob(
      encodedPayload.padEnd(
        Math.ceil(encodedPayload.length / 4) * 4,
        "="
      )
    )
  );

  const userId =
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ??
    payload.sub ??
    payload.nameid;

  if (userId === undefined || userId === null) {
    throw new Error("Please log in again.");
  }

  return `checkout-request:${String(userId)}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (error.response?.status === 403) {
      return "You do not have permission to perform this action.";
    }

    if (
      typeof error.response?.data === "string" &&
      error.response.data.trim()
    ) {
      return error.response.data;
    }
  }

  return fallback;
}

function Cart({
  refreshKey = 0,
  cartBusy,
  beginCartOperation,
  endCartOperation,
}: CartProps) {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [error, setError] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);

  const checkoutRequestId = useRef<string | null>(null);
  const fetchVersion = useRef(0);
  const loadedRefreshKey = useRef(-1);

  useEffect(() => {
    let active = true;
    const version = ++fetchVersion.current;

    const loadCart = async () => {
      setLoading(true);
      setError("");

      try {
        const storageKey = getCheckoutStorageKey();
        const savedRequestId = sessionStorage.getItem(storageKey);

        checkoutRequestId.current = savedRequestId;
        setHasPendingCheckout(Boolean(savedRequestId));

        const response = await api.get<CartResponse>("/CartItems");

        if (active && version === fetchVersion.current) {
          setCart(response.data);
          loadedRefreshKey.current = refreshKey;
        }
      } catch (loadError) {
        if (active && version === fetchVersion.current) {
          setError(
            getErrorMessage(loadError, "Unable to load your cart.")
          );
        }
      } finally {
        if (active && version === fetchVersion.current) {
          setLoading(false);
        }
      }
    };

    void loadCart();

    return () => {
      active = false;
    };
  }, [refreshKey, retryVersion]);

  const reloadCart = async () => {
    const version = ++fetchVersion.current;

    const response = await api.get<CartResponse>("/CartItems");

    if (version === fetchVersion.current) {
      setCart(response.data);
      loadedRefreshKey.current = refreshKey;
    }
  };

  const handleRemove = async (id: number) => {
    if (loading || loadedRefreshKey.current !== refreshKey) return;
    if (!beginCartOperation()) return;

    setError("");
    setCheckoutMessage("");

    try {
      await api.delete(`/CartItems/${id}`);
      await reloadCart();
    } catch (removeError) {
      setError(
        getErrorMessage(
          removeError,
          "Unable to update your cart. Refresh it before trying again."
        )
      );
    } finally {
      endCartOperation();
    }
  };

  const handleUpdateQuantity = async (
    id: number,
    quantity: number
  ) => {
    if (quantity < 1) return;
    if (loading || loadedRefreshKey.current !== refreshKey) return;
    if (!beginCartOperation()) return;

    setError("");
    setCheckoutMessage("");

    try {
      await api.put(`/CartItems/${id}`, null, {
        params: { quantity },
      });

      await reloadCart();
    } catch (updateError) {
      setError(
        getErrorMessage(
          updateError,
          "Unable to update your cart. Refresh it before trying again."
        )
      );
    } finally {
      endCartOperation();
    }
  };

  const handleCheckout = async () => {
    if (loading || loadedRefreshKey.current !== refreshKey) return;
    if (!cart) return;
    if (cart.items.length === 0 && !hasPendingCheckout) return;
    if (!beginCartOperation()) return;

    setCheckingOut(true);
    setCheckoutMessage("");
    setError("");

    // Ignore any older cart response still in flight.
    ++fetchVersion.current;

    try {
      const storageKey = getCheckoutStorageKey();

      if (!checkoutRequestId.current) {
        checkoutRequestId.current =
          sessionStorage.getItem(storageKey) ??
          crypto.randomUUID();
      }

      sessionStorage.setItem(
        storageKey,
        checkoutRequestId.current
      );

      setHasPendingCheckout(true);

      const response = await api.post<{ orderId: number }>(
        "/Orders/checkout",
        {},
        {
          headers: {
            "Idempotency-Key": checkoutRequestId.current,
          },
        }
      );

      setCheckoutMessage(
        `Order #${response.data.orderId} placed successfully.`
      );

      // Remove the saved ID only after a successful response.
      try {
        sessionStorage.removeItem(storageKey);
        checkoutRequestId.current = null;
        setHasPendingCheckout(false);
      } catch {
        setError(
          "Order confirmed, but its saved request could not be cleared."
        );
      }

      // A repeated request may return an older successful order.
      // Load the actual cart instead of assuming it is empty.
      try {
        await reloadCart();
      } catch {
        loadedRefreshKey.current = -1;
        setError(
          "Order confirmed. Refresh your cart to see its current contents."
        );
      }
    } catch (checkoutError) {
      console.error("Checkout failed:", checkoutError);

      setError(
        getErrorMessage(
          checkoutError,
          "Could not confirm your order. Check My Orders, then retry using the same request."
        )
      );
    } finally {
      setCheckingOut(false);
      endCartOperation();
    }
  };

  const disabled =
    cartBusy ||
    loading ||
    loadedRefreshKey.current !== refreshKey;

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart</h2>

      {checkoutMessage && (
        <p role="status">{checkoutMessage}</p>
      )}

      {error && <p role="alert">{error}</p>}

      <button
        type="button"
        disabled={cartBusy || loading}
        onClick={() => setRetryVersion((current) => current + 1)}
      >
        {loading ? "Loading cart..." : "Refresh Cart"}
      </button>

            {hasPendingCheckout && !checkingOut && (
        <p>
          To try again, select Retry Same Checkout.
          This helps prevent duplicate orders.
          If you are unsure whether your order was placed,
          check My Orders first.
        </p>
      )}

      {!loading && cart && (
        <>
          {cart.items.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cart.items.map((item) => (
                <div key={item.id}>
                  <h3>{item.product.name}</h3>

                  <p>
                    Unit Price: ${item.unitPrice.toFixed(2)}
                  </p>

                  <div className="cart-quantity">
                    <span>Quantity: {item.quantity}</span>

                    <button
                      type="button"
                      disabled={disabled || item.quantity <= 1}
                      aria-label={`Decrease quantity of ${item.product.name}`}
                      onClick={() =>
                        handleUpdateQuantity(
                          item.id,
                          item.quantity - 1
                        )
                      }
                    >
                      -
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`Increase quantity of ${item.product.name}`}
                      onClick={() =>
                        handleUpdateQuantity(
                          item.id,
                          item.quantity + 1
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="cart-remove"
                    disabled={disabled}
                    onClick={() => handleRemove(item.id)}
                  >
                    Remove
                  </button>

                  <hr />
                </div>
              ))}

              <div className="cart-total">
                <span>Total Price</span>
                <strong>${cart.total.toFixed(2)}</strong>
              </div>
            </>
          )}

          {(cart.items.length > 0 || hasPendingCheckout) && (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={disabled}
            >
              {checkingOut
                ? "Confirming order..."
                : hasPendingCheckout
                  ? "Retry Same Checkout"
                  : "Place Order"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default Cart;