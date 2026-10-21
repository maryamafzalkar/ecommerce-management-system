import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { Trash2 } from "lucide-react";
import axios from "axios";
import api from "./api";
import "./App.css";
import ProductForm from "./ProductForm";
import Login from "./Login";
import Cart from "./Cart";
import MyOrders from "./MyOrders";
import AdminOrders from "./AdminOrders";

type Category = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
};

type ProductEditorProps = {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string;
  onSaved: (product: Product) => void;
  onCancel: () => void;
};

const PRODUCTS_PER_PAGE = 4;

function ProductEditor({
  categories,
  products,
  loading,
  error,
  onSaved,
  onCancel,
}: ProductEditorProps) {
  const { productId } = useParams();
  const editing = productId !== undefined;

  const product = editing
    ? products.find((item) => item.id === Number(productId))
    : null;

  if (loading) {
    return <p role="status">Loading product information...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (editing && !product) {
    return (
      <section className="catalog-panel">
        <h2>Product not found</h2>
        <button type="button" onClick={onCancel}>
          Back to Products
        </button>
      </section>
    );
  }

  return (
    <section className="catalog-panel">
      <div className="product-editor-toolbar">
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
        >
          Back to Products
        </button>
      </div>

      <ProductForm
        key={product?.id ?? "new-product"}
        categories={categories}
        editingProduct={product ?? null}
        onProductSaved={onSaved}
        onCancelEdit={onCancel}
      />
    </section>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [cartVersion, setCartVersion] = useState(0);
  const [cartBusy, setCartBusy] = useState(false);

  const cartBusyRef = useRef(false);
  const searchBusyRef = useRef(false);

  const token = localStorage.getItem("token");

  let role = "";
  let username = "";

  if (token) {
    try {
      const tokenPart = token.split(".")[1];

      if (!tokenPart) {
        throw new Error("Invalid token.");
      }

      const encodedPayload = tokenPart
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
          Uint8Array.from(decodedPayload, (char) =>
            char.charCodeAt(0)
          )
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

  const isAdmin = role === "Admin";
  const isCustomer = role === "Customer";
  const productsPath = isAdmin ? "/admin/products" : "/products";

  useEffect(() => {
    if (!token) return;

    let active = true;

    const loadCatalog = async () => {
      setLoadingProducts(true);
      setLoadError("");

      try {
        const [categoryResponse, productResponse] = await Promise.all([
          api.get<Category[]>("/Categories"),
          api.get<Product[]>("/Products"),
        ]);

        if (!active) return;

        setCategories(categoryResponse.data);
        setAllProducts(productResponse.data);
        setProducts(productResponse.data);
      } catch (error) {
        if (!active) return;

        console.error("Failed to load catalog:", error);
        setLoadError(
          "Unable to load products. Refresh the page to try again."
        );
      } finally {
        if (active) {
          setLoadingProducts(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

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

  const handleLogout = () => {
    if (cartBusyRef.current) return;

    localStorage.removeItem("token");
    window.location.assign("/");
  };

  const handleSearch = async () => {
    if (searchBusyRef.current) return;

    searchBusyRef.current = true;
    setSearching(true);
    setSearchError("");

    try {
      const response = await api.get<Product[]>("/Products", {
        params: { search, sort },
      });

      setProducts(response.data);
      setProductPage(1);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError("Unable to search products. Please try again.");
    } finally {
      searchBusyRef.current = false;
      setSearching(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/Products/${id}`);

      setAllProducts((current) =>
        current.filter((product) => product.id !== id)
      );

      setProducts((current) =>
        current.filter((product) => product.id !== id)
      );
    } catch (error) {
      console.error("Delete failed:", error);

      if (
        axios.isAxiosError(error) &&
        typeof error.response?.data === "string"
      ) {
        alert(error.response.data);
      } else {
        alert("Failed to delete product.");
      }
    }
  };

  const handleProductSaved = (savedProduct: Product) => {
    const exists = allProducts.some(
      (product) => product.id === savedProduct.id
    );

    const updatedProducts = exists
      ? allProducts.map((product) =>
          product.id === savedProduct.id ? savedProduct : product
        )
      : [...allProducts, savedProduct];

    setAllProducts(updatedProducts);
    setProducts(updatedProducts);
    setSearch("");
    setSort("");
    setSearchError("");
    setProductPage(1);

    navigate("/admin/products");
  };

  const handleAddToCart = async (productId: number) => {
    if (!beginCartOperation()) return;

    try {
      await api.post("/CartItems", null, {
        params: { productId, quantity: 1 },
      });

      setCartVersion((current) => current + 1);
      alert("Product added to cart!");
    } catch (error) {
      console.error("Add to cart failed:", error);

      if (
        axios.isAxiosError(error) &&
        typeof error.response?.data === "string"
      ) {
        alert(error.response.data);
      } else {
        alert("Failed to add product to cart.");
      }
    } finally {
      endCartOperation();
    }
  };

  if (!token) {
    return <Login />;
  }

  if (!isAdmin && !isCustomer) {
    return (
      <div className="App">
        <p role="alert">
          Unable to read your account role. Please log in again.
        </p>

        <button type="button" onClick={handleLogout}>
          Back to Login
        </button>
      </div>
    );
  }

  const pageCount = Math.max(
    1,
    Math.ceil(products.length / PRODUCTS_PER_PAGE)
  );

  const currentPage = Math.min(productPage, pageCount);
  const firstProductIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;

  const visibleProducts = products.slice(
    firstProductIndex,
    firstProductIndex + PRODUCTS_PER_PAGE
  );

  const navigationItems = isAdmin
    ? [
        { to: "/admin/products", label: "Products" },
        { to: "/admin/orders", label: "Orders" },
      ]
    : [
        { to: "/products", label: "Products" },
        { to: "/cart", label: "Cart" },
        { to: "/my-orders", label: "My Orders" },
      ];

  const catalogPage = (
    <section className="catalog-panel">
      <div className="section-heading">
        <div>
          <h2>Products</h2>
          <p>
            {isAdmin
              ? "Manage your product catalog and stock."
              : "Browse products and add items to your cart."}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/admin/products/new")}
          >
            + Add Product
          </button>
        )}
      </div>

      <form
        className="catalog-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSearch();
        }}
      >
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search products..."
          value={search}
          disabled={loadingProducts || searching}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          aria-label="Sort products"
          value={sort}
          disabled={loadingProducts || searching}
          onChange={(event) => setSort(event.target.value)}
        >
          <option value="">Default order</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="name_desc">Name: Z to A</option>
        </select>

        <button
          type="submit"
          className="primary-button"
          disabled={loadingProducts || searching}
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="categories-list" aria-label="Product categories">
        {categories.map((category) => (
          <span className="category" key={category.id}>
            {category.name}
          </span>
        ))}
      </div>

      {loadError && <p role="alert">{loadError}</p>}
      {searchError && <p role="alert">{searchError}</p>}

      {loadingProducts ? (
        <p role="status">Loading products...</p>
      ) : (
        <>
          <div className="products-section">
            <table className="products-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Description</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Category</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.description}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.stockQuantity}</td>

                    <td>
                      {categories.find(
                        (category) =>
                          category.id === product.categoryId
                      )?.name ?? "Unknown category"}
                    </td>

                    <td>
                      {isCustomer && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleAddToCart(product.id)
                          }
                          disabled={
                            cartBusy || product.stockQuantity <= 0
                          }
                        >
                          {product.stockQuantity <= 0
                            ? "Out of stock"
                            : "Add to Cart"}
                        </button>
                      )}

                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/admin/products/${product.id}/edit`
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            title="Delete product"
                            aria-label={`Delete ${product.name}`}
                            onClick={() =>
                              void handleDelete(product.id)
                            }
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

          {products.length === 0 && !loadError && (
            <p className="empty-message">
              No products to display.
            </p>
          )}

          {products.length > 0 && (
            <nav className="pagination" aria-label="Product pages">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setProductPage(currentPage - 1)}
              >
                Previous
              </button>

              <span aria-live="polite">
                Page {currentPage} of {pageCount}
              </span>

              <button
                type="button"
                disabled={currentPage === pageCount}
                onClick={() => setProductPage(currentPage + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );

  return (
    <div className={`App${isAdmin ? " admin-app" : ""}`}>
      <header className="app-header">
        <div>
          <h1>E-Commerce Management System</h1>

          {username && (
            <p className="app-welcome">
              Welcome, <strong>{username}</strong>
              {isAdmin && (
                <span className="admin-role-badge">Admin</span>
              )}
            </p>
          )}
        </div>

        <button
          type="button"
          className="logout-button"
          disabled={cartBusy}
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <nav className="page-nav" aria-label="Main navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive
                ? "page-nav-link is-active"
                : "page-nav-link"
            }
            aria-disabled={cartBusy}
            onClick={(event) => {
              if (cartBusyRef.current) {
                event.preventDefault();
              }
            }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="page-content">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={productsPath} replace />}
          />

          {isAdmin ? (
            <>
              <Route
                path="/admin/products"
                element={catalogPage}
              />

              <Route
                path="/admin/products/new"
                element={
                  <ProductEditor
                    categories={categories}
                    products={allProducts}
                    loading={loadingProducts}
                    error={loadError}
                    onSaved={handleProductSaved}
                    onCancel={() => navigate("/admin/products")}
                  />
                }
              />

              <Route
                path="/admin/products/:productId/edit"
                element={
                  <ProductEditor
                    categories={categories}
                    products={allProducts}
                    loading={loadingProducts}
                    error={loadError}
                    onSaved={handleProductSaved}
                    onCancel={() => navigate("/admin/products")}
                  />
                }
              />

              <Route
                path="/admin/orders"
                element={
                  <section className="admin-orders-panel">
                    <AdminOrders />
                  </section>
                }
              />
            </>
          ) : (
            <>
              <Route path="/products" element={catalogPage} />

              <Route
                path="/cart"
                element={
                  <Cart
                    refreshKey={cartVersion}
                    cartBusy={cartBusy}
                    beginCartOperation={beginCartOperation}
                    endCartOperation={endCartOperation}
                  />
                }
              />

              <Route
                path="/my-orders"
                element={
                  <section className="customer-orders-page">
                    <MyOrders />
                  </section>
                }
              />
            </>
          )}

          <Route
            path="*"
            element={<Navigate to={productsPath} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;