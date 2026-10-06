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

  if (!cart) {
    return <p>Loading cart...</p>;
  }

  return (
    <div>
      <h2>Shopping Cart</h2>

      {cart.items.map((item) => (
        <div key={item.id}>
          <p>{item.product.name}</p>
          <p>Quantity: {item.quantity}</p>
          <p>Price: {item.unitPrice}</p>
        </div>
      ))}

      <h3>Total: {cart.total}</h3>
    </div>
  );
}

export default Cart;