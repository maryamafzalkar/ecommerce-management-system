import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "./api";
import "./App.css";
import ProductForm from "./ProductForm";
import Login from "./Login";

function App() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");

  useEffect(() => {
    api
      .get("/Categories")
      .then((response) => {
        setCategories(response.data);
      })
      .catch((error) => {
        console.error("Failed to load categories:", error);
      });

    api
      .get("/Products")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Failed to load products:", error);
      });
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/Products/${id}`);

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
      );

      if (editingProduct?.id === id) {
        setEditingProduct(null);
      }
    } catch (error) {
      console.error("DELETE ERROR:", error);
      alert("Failed to delete product.");
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
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === savedProduct.id ? savedProduct : product
        )
      );

      setEditingProduct(null);
      return;
    }

    setProducts((currentProducts) => [
      ...currentProducts,
      savedProduct,
    ]);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleSearch = async () => {
    try {
      
      const response = await api.get("/Products", {
        params: {
          search: search,
          sort: sort,
        },
      });

      setProducts(response.data);
    } catch (error) {
      console.error("SEARCH ERROR:", error);
    }
  };

  if (!token) {
    return <Login />;
  }

  return (
    <div className="App">
      <h1>E-Commerce Management System</h1>

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button type="button" onClick={handleSearch}>
        Search
      </button>

      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        <option value="">Default</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="name_asc">Name: A to Z</option>
        <option value="name_desc">Name: Z to A</option>
      </select>

      <button type="button" onClick={handleLogout}>
        Logout
      </button>

      <h2>Categories</h2>

      <div className="categories-list">
        {categories.map((category, index) => (
          <div
            className="category"
            key={category.id ?? index}
          >
            {category.name}
          </div>
        ))}
      </div>

      <ProductForm
        categories={categories}
        editingProduct={editingProduct}
        onProductSaved={handleProductSaved}
        onCancelEdit={handleCancelEdit}
      />

      <h2>Products</h2>

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
                    (category) =>
                      category.id === product.categoryId
                  )?.name
                }
              </td>

              <td>
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
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;