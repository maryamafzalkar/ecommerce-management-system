import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";
import api from "./api";
import "./App.css";
import ProductForm from "./ProductForm";
import Login from "./Login";
import Cart from "./Cart";
import MyOrders from "./MyOrders";
import AdminOrders from "./AdminOrders";

function App() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [cartVersion, setCartVersion] = useState(0);

  const [cartBusy, setCartBusy] = useState(false);
  const cartBusyRef = useRef(false);

  const beginCartOperation = () => {
    if (cartBusyRef.current) return false;

    cartBusyRef.current = true;
    setCartBusy(true);
    return true;
  };

  const endCartOperation = () => {
    cartBusyRef.current = false;
    setCartBusy(false);
  };

  useEffect(() => {
    api
      .get("/Categories")
      .then((response) => setCategories(response.data))
      .catch((error) => {
        console.error("Failed to load categories:", error);
      });

    api
      .get("/Products")
      .then((response) => setProducts(response.data))
      .catch((error) => {
        console.error("Failed to load products:", error);
      });
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/Products/${id}`);

      setProducts((current) =>
        current.filter((product) => product.id !== id)
      );

      if (editingProduct?.id === id) {
        setEditingProduct(null);
      }
    } catch (error) {
      console.error("DELETE ERROR:", error);

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 409 &&
        typeof error.response.data === "string"
      ) {
        alert(error.response.data);
      } else {
        alert("Failed to delete product.");
      }
    }
  };

  const handleUpdate = (product: any) => {
    setEditingProduct(product);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleProductSaved = (savedProduct: any) => {
    if (editingProduct) {
      setProducts((current) =>
        current.map((product) =>
          product.id === savedProduct.id ? savedProduct : product
        )
      );

      setEditingProduct(null);
      return;
    }

    setProducts((current) => [...current, savedProduct]);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const token = localStorage.getItem("token");

  let role = "";
  let username = "";

  if (token) {
    try {
      const encodedPayload = token.split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const decodedPayload = atob(
        encodedPayload.padEnd(
          Math.ceil(encodedPayload.length / 4) * 4,
          "="
        )
      );

      const payload = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(decodedPayload, (char) => char.charCodeAt(0))
        )
      );

      role =
        payload[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] ||
        payload.role ||
        "";

      username =
        payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        ] ||
        payload.unique_name ||
        payload.name ||
        "";
    } catch {
      role = "";
      username = "";
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleSearch = async () => {
    try {
      const response = await api.get("/Products", {
        params: { search, sort },
      });

      setProducts(response.data);
    } catch (error) {
      console.error("SEARCH ERROR:", error);
    }
  };

  const handleAddToCart = async (productId: number) => {
    if (!beginCartOperation()) return;

    try {
      await api.post(
        `/CartItems?productId=${productId}&quantity=1`,
        {}
      );

      setCartVersion((current) => current + 1);
      alert("Product added to cart!");
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);
      alert("Failed to add product to cart.");
    } finally {
      endCartOperation();
    }
  };

  if (!token) {
    return <Login />;
  }

  return (
    <div className="App">
      <h1>E-Commerce Management System</h1>

      {username && (
        <p>
          Welcome, <strong>{username}</strong>
        </p>
      )}

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <button type="button" onClick={handleSearch}>
        Search
      </button>

      <select
        value={sort}
        onChange={(event) => setSort(event.target.value)}
      >
        <option value="">Default</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="name_asc">Name: A to Z</option>
        <option value="name_desc">Name: Z to A</option>
      </select>

      <button
        type="button"
        onClick={handleLogout}
        disabled={cartBusy}
      >
        Logout
      </button>

      <h2>Categories</h2>

      <div className="categories-list">
        {categories.map((category, index) => (
          <div className="category" key={category.id ?? index}>
            {category.name}
          </div>
        ))}
      </div>

      {role === "Admin" && (
        <ProductForm
          categories={categories}
          editingProduct={editingProduct}
          onProductSaved={handleProductSaved}
          onCancelEdit={handleCancelEdit}
        />
      )}

      <h2>Products</h2>

      <div className="products-section">
        <table className="products-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>${product.price}</td>
                <td>{product.stockQuantity}</td>

                <td>
                  {
                    categories.find(
                      (category) => category.id === product.categoryId
                    )?.name
                  }
                </td>

                <td>
                  {role === "Customer" && (
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={cartBusy}
                      title="Add to cart"
                    >
                      Add to Cart
                    </button>
                  )}

                  {role === "Admin" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdate(product)}
                        title="Edit product"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        title="Delete product"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {role === "Customer" && (
        <Cart
          refreshKey={cartVersion}
          cartBusy={cartBusy}
          beginCartOperation={beginCartOperation}
          endCartOperation={endCartOperation}
        />
      )}

      {role === "Admin" && <AdminOrders />}

      {role === "Customer" && (
        <div className="orders-card">
          <div className="orders-card-header">
            <h3>📦 My Orders</h3>
            <p>View your order history and status</p>

            <button
              type="button"
              onClick={() => setShowMyOrders((current) => !current)}
            >
              {showMyOrders ? "Hide Orders" : "View My Orders"}
            </button>
          </div>

          {showMyOrders && (
            <div className="orders-card-content">
              <MyOrders />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;