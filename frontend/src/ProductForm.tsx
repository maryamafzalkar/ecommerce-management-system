import { useEffect, useState } from "react";
import api from "./api";
import {
  Package,
  Tag,
  DollarSign,
  Boxes,
  Plus,
  Save,
  X
} from "lucide-react";

interface ProductFormProps {
  categories: any[];
  editingProduct: any | null;
  onProductSaved: (product: any) => void;
  onCancelEdit: () => void;
}

function ProductForm({
  categories,
  editingProduct,
  onProductSaved,
  onCancelEdit
}: ProductFormProps) {

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // وقتی Edit را می‌زنیم،
  // اطلاعات محصول داخل فرم قرار می‌گیرد
  useEffect(() => {

    if (editingProduct) {

      setName(editingProduct.name ?? "");
      setDescription(editingProduct.description ?? "");
      setPrice(String(editingProduct.price ?? ""));
      setStockQuantity(
        String(editingProduct.stockQuantity ?? "")
      );
      setCategoryId(
        String(editingProduct.categoryId ?? "")
      );

    } else {

      setName("");
      setDescription("");
      setPrice("");
      setStockQuantity("");
      setCategoryId("");

    }

  }, [editingProduct]);

  // SUBMIT
  const handleSubmit = async (
    event: React.FormEvent
  ) => {

    event.preventDefault();

    // Validation
    if (!name.trim()) {
      alert("Please enter product name.");
      return;
    }

    if (!description.trim()) {
      alert("Please enter description.");
      return;
    }

    if (!price) {
      alert("Please enter price.");
      return;
    }

    if (!stockQuantity) {
      alert("Please enter stock quantity.");
      return;
    }

    if (!categoryId) {
      alert("Please select a category.");
      return;
    }

    const productData = {
      name: name,
      description: description,
      price: Number(price),
      stockQuantity: Number(stockQuantity),
      categoryId: Number(categoryId)
    };

    try {

      // =========================
      // UPDATE
      // =========================

      if (editingProduct) {

        const response = await api.put(
          `/Products/${editingProduct.id}`,
          {
            id: editingProduct.id,
            ...productData
          }
        );

        alert("Product updated successfully!");

        onProductSaved({
          ...editingProduct,
          ...productData,
          ...(response.data ?? {})
        });

        return;
      }

      // =========================
      // CREATE
      // =========================

      const response = await api.post(
        "/Products",
        productData
      );

      alert("Product created successfully!");

      onProductSaved(response.data);

    } catch (error: any) {

      console.error("PRODUCT SAVE ERROR:", error);
      
       alert("Please check your product information."); 
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="product-form"
    >

      {/* TITLE */}

      <h2>
        {editingProduct
          ? "Edit Product"
          : "Add Product"}
      </h2>

      {/* PRODUCT NAME */}

      <div className="form-group">

        <label>
          <Package size={18} />
          Product Name
        </label>

        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

      </div>

      {/* DESCRIPTION */}

      <div className="form-group">

        <label>
          <Tag size={18} />
          Description
        </label>

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

      </div>

      {/* CATEGORY */}

      <div className="form-group">

        <label>
          <Tag size={18} />
          Category
        </label>

        <select
          value={categoryId}
          onChange={(e) =>
            setCategoryId(e.target.value)
          }
        >

          <option value="">
            Select category
          </option>

          {categories.map((category) => (

            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>

          ))}

        </select>

      </div>

      {/* STOCK */}

      <div className="form-group">

        <label>
          <Boxes size={18} />
          Stock Quantity
        </label>

        <input
          type="number"
          placeholder="Stock quantity"
          value={stockQuantity}
          onChange={(e) =>
            setStockQuantity(e.target.value)
          }
        />

      </div>

      {/* PRICE */}

      <div className="form-group">

        <label>
          <DollarSign size={18} />
          Price
        </label>

        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={price}
          onChange={(e) =>
            setPrice(e.target.value)
          }
        />

      </div>

      {/* BUTTON */}

      <button
        type="submit"
      >

        {editingProduct ? (
          <>
            <Save size={18} />
            Update Product
          </>
        ) : (
          <>
            <Plus size={18} />
            Create Product
          </>
        )}

      </button>

      {/* CANCEL EDIT */}

      {editingProduct && (

        <button
          type="button"
          onClick={onCancelEdit}
        >
          <X size={18} />
          Cancel
        </button>

      )}

    </form>
  );
}

export default ProductForm;