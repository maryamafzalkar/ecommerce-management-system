import { useEffect, useState } from "react";
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

function Cart() {
  const [cart, setCart] = useState<CartResponse | null>(null);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const response = await api.get<CartResponse>("/CartItems");
        setCart(response.data);
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    };

    loadCart();
  }, []);

    const handleRemove = async (id: number) => {
  try {
    await api.delete(`/CartItems/${id}`);

    const response = await api.get<CartResponse>("/CartItems");

    setCart(response.data);
  } catch (error) {
    console.error("Error removing cart item:", error);
  }
};
const handleUpdateQuantity = async (id: number, quantity: number) => {
  try {
    await api.put(`/CartItems/${id}?quantity=${quantity}`);

    const response = await api.get<CartResponse>("/CartItems");

    setCart(response.data);
  } catch (error) {
    console.error("Error updating cart quantity:", error);
  }
};
  if (!cart) {
    return <p>Loading cart...</p>;
  }

  return (
  <div className="shopping-cart">
    <h2>Shopping Cart</h2>

      {cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.items.map((item) => (
            <div key={item.id}>
              <h3>{item.product.name}</h3>

            
              <p>
                Unit Price: ${item.unitPrice}
              </p>

              <div className="cart-quantity">
               
  <span>Quantity: {item.quantity}</span>

  <button
    type="button"
    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
    disabled={item.quantity <= 1}
  >
    -
  </button>

  <button
    type="button"
    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
  >
    +
  </button>
</div>
              <button
         className="cart-remove"
      onClick={() => handleRemove(item.id)}
>                Remove
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
    </div>
  );
}

export default Cart;
