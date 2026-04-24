"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, Bell, Settings, Pencil, Trash2, X, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { formatNaira } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

interface SubCategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  subCategories?: SubCategory[];
}

interface VendorProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  saleType?: "PREORDER" | "IN_STOCK";
  imageUrls?: string[];
  category?: { id: string; name: string };
  subCategory?: { id: string; name: string };
  categoryId?: string;
  subCategoryId?: string;
}

type View = "list" | "add" | "edit" | "success";

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: VendorProduct[] = [
  {
    id: "mock-p1",
    name: "Primark Shirt",
    price: 20000,
    stock: 20,
    isAvailable: true,
    saleType: "IN_STOCK",
    imageUrls: [],
    category: { id: "e1074ea4-91c6-4afe-b3bf-0d4ec668f7ff", name: "Clothing & Accessories" },
    subCategory: { id: "sub-shirts", name: "Shirts" },
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_CATEGORIES: Category[] = [
  { id: "69345327-e2bb-4f39-935d-80feefcf16a8", name: "Body care & Beauty", icon: "💄", subCategories: [{ id: "sub-skincare", name: "Skincare" }, { id: "sub-haircare", name: "Haircare" }] },
  { id: "e1074ea4-91c6-4afe-b3bf-0d4ec668f7ff", name: "Clothing & Accessories", icon: "👗", subCategories: [{ id: "sub-shirts", name: "Shirts" }, { id: "sub-trousers", name: "Trousers" }, { id: "sub-shoes", name: "Shoes" }, { id: "sub-bags", name: "Bags" }] },
  { id: "7d2df096-6fe3-4f0d-b77d-53913578a874", name: "Gadgets & Accessories", icon: "📱", subCategories: [{ id: "sub-phones", name: "Phones" }, { id: "sub-laptops", name: "Laptops" }, { id: "sub-accessories", name: "Accessories" }] },
  { id: "e16894eb-c47e-4762-ac09-b1e25ce404b0", name: "Others", icon: "🛠️", subCategories: [] },
  { id: "dc1e5512-3b83-4e7d-9ddf-0aa2ead456ac", name: "Provisions", icon: "🍔", subCategories: [{ id: "sub-snacks", name: "Snacks" }, { id: "sub-beverages", name: "Beverages" }, { id: "sub-meals", name: "Meals" }] },
  { id: "92591a83-e233-46ee-8a9a-64f183b81148", name: "Sports", icon: "⚽", subCategories: [{ id: "sub-equipment", name: "Equipment" }, { id: "sub-apparel", name: "Apparel" }] },
  { id: "db8b93d5-2f8b-4ae7-b5d2-ef0465612ae1", name: "Stationery", icon: "📚", subCategories: [{ id: "sub-books", name: "Textbooks" }, { id: "sub-notebooks", name: "Notebooks" }, { id: "sub-pens", name: "Pens & Pencils" }] },
];

// ── Shared modal backdrop ──────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />;
}

// ── Delete confirm modal ───────────────────────────────────────────────────

function DeleteModal({ onClose, onConfirm, isLoading }: {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[28px] pb-[28px] w-full max-w-[360px]">
          <p className="font-jakarta font-bold text-[16px] text-[#151515] tracking-[-0.04em] mb-[20px]">
            Are you sure you want to delete this product?
          </p>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full h-[53px] rounded-[8px] bg-[#E53935] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 mb-[14px] hover:bg-[#C62828] transition-colors"
          >
            {isLoading ? "Deleting..." : "Delete Product"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full font-jakarta text-[14px] text-[#9B9B9B] underline tracking-[-0.04em]"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

// ── Success modal ──────────────────────────────────────────────────────────

function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[32px] pt-[32px] pb-[32px] w-full max-w-[360px] relative flex flex-col items-center">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute top-[16px] right-[16px]"
          >
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <div className="w-[72px] h-[72px] rounded-full bg-[#2E7D32] flex items-center justify-center mb-[20px]">
            <Check size={36} className="text-white" strokeWidth={3} />
          </div>
          <p className="font-jakarta text-[14px] font-semibold text-[#2E7D32] text-center leading-[1.6] tracking-[-0.04em]">
            {message}
          </p>
        </div>
      </div>
    </>
  );
}

// ── Product form (add / edit) ──────────────────────────────────────────────

interface ProductFormProps {
  mode: "add" | "edit";
  product?: VendorProduct;
  categories: Category[];
  onBack: () => void;
  onSuccess: () => void;
  isMock: boolean;
}

function ProductForm({ mode, product, categories, onBack, onSuccess, isMock }: ProductFormProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.category?.id ?? product?.categoryId ?? "");
  const [subCategoryId, setSubCategoryId] = useState(product?.subCategory?.id ?? product?.subCategoryId ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [quantity, setQuantity] = useState(product ? String(product.stock) : "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [saleType, setSaleType] = useState<"PREORDER" | "IN_STOCK">(product?.saleType ?? "IN_STOCK");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrls?.[0] ?? null);
  const [submitting, setSubmitting] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!name.trim() || !price || !quantity) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (isMock) {
      toast.success(mode === "add" ? "Product added! (mock)" : "Product updated! (mock)");
      onSuccess();
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        const { data } = await apiClient.post("/upload/image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = data?.url ?? data?.data?.url;
      }

      const payload: Record<string, unknown> = {
        name: name.trim(),
        price: parseFloat(price),
        stock: parseInt(quantity, 10),
        isAvailable,
        saleType,
        ...(categoryId && { categoryId }),
        ...(subCategoryId && { subCategoryId }),
        ...(imageUrl && { imageUrls: [imageUrl] }),
      };

      if (mode === "add") {
        await apiClient.post("/products", payload);
      } else {
        await apiClient.patch(`/products/${product!.id}`, payload);
      }

      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Header */}
      <div className="bg-[#2E7D32] rounded-b-[12px] h-[90px] flex items-center px-[20px] gap-[12px]">
        <button type="button" aria-label="Go back" onClick={onBack} className="text-white">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <span className="font-jakarta text-[16px] font-semibold text-white leading-[1.26] tracking-[-0.04em]">
          {mode === "add" ? "Add new product" : "Edit product"}
        </span>
      </div>

      <div className="px-[20px] pt-[24px] pb-[40px] flex flex-col gap-[18px]">
        {/* Product Name */}
        <div>
          <label className="font-jakarta text-[13px] font-semibold text-[#333333] tracking-[-0.04em] mb-[5px] block">
            Product Name <span className="text-[#FDC500]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g NASCO Cornflakes, etc"
            className="w-full rounded-[8px] border border-[#EAEAEA] bg-white px-[14px] py-[14px] font-jakarta text-[12px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]"
          />
        </div>

        {/* Category — only shown for add */}
        {mode === "add" && (
          <div>
            <label className="font-jakarta text-[13px] font-semibold text-[#333333] tracking-[-0.04em] mb-[5px] block">
              Select product category <span className="text-[#FDC500]">*</span>
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setSubCategoryId(""); }}
                aria-label="Product category"
                className="w-full appearance-none rounded-[8px] border border-[#EAEAEA] bg-white px-[14px] py-[14px] font-jakarta text-[12px] text-[#333333] focus:outline-none focus:border-[#2E7D32]"
              >
                <option value="">Select the relevant category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[#333333]">▼</span>
            </div>
          </div>
        )}

        {/* Sub-category — only shown for add, only when category has sub-categories */}
        {mode === "add" && (() => {
          const subs = categories.find((c) => c.id === categoryId)?.subCategories ?? [];
          if (!categoryId || subs.length === 0) return null;
          return (
            <div>
              <label className="font-jakarta text-[13px] font-semibold text-[#333333] tracking-[-0.04em] mb-[5px] block">
                Select product sub-category <span className="text-[#FDC500]">*</span>
              </label>
              <div className="relative">
                <select
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  aria-label="Product sub-category"
                  className="w-full appearance-none rounded-[8px] border border-[#EAEAEA] bg-white px-[14px] py-[14px] font-jakarta text-[12px] text-[#333333] focus:outline-none focus:border-[#2E7D32]"
                >
                  <option value="">Select the relevant sub-category</option>
                  {subs.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[#333333]">▼</span>
              </div>
            </div>
          );
        })()}

        {/* Price */}
        <div>
          <label className="font-jakarta text-[13px] font-semibold text-[#333333] tracking-[-0.04em] mb-[5px] block">
            Price per unit (PPU) <span className="text-[#FDC500]">*</span>
          </label>
          <div className="flex rounded-[8px] border border-[#EAEAEA] bg-white overflow-hidden focus-within:border-[#2E7D32]">
            <div className="flex items-center justify-center px-[14px] border-r border-[#EAEAEA] bg-[#F7FFF8]">
              <span className="font-jakarta text-[14px] font-bold text-[#333333]">₦</span>
            </div>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g 25000, etc"
              min="0"
              className="flex-1 px-[14px] py-[14px] font-jakarta text-[12px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="font-jakarta text-[13px] font-semibold text-[#333333] tracking-[-0.04em] mb-[5px] block">
            Quantity <span className="text-[#FDC500]">*</span>
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g 10, 20 etc"
            min="0"
            className="w-full rounded-[8px] border border-[#EAEAEA] bg-white px-[14px] py-[14px] font-jakarta text-[12px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]"
          />
        </div>

        {/* Availability */}
        <div>
          <label className="font-jakarta text-[13px] font-semibold text-[#333333] tracking-[-0.04em] mb-[10px] block">
            Availability <span className="text-[#FDC500]">*</span>
          </label>
          <div className="flex items-center gap-[24px]">
            <label className="flex items-center gap-[8px] cursor-pointer">
              <div
                onClick={() => setIsAvailable(true)}
                className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center cursor-pointer ${isAvailable ? "border-[#2E7D32] bg-[#2E7D32]" : "border-[#9B9B9B]"}`}
              >
                {isAvailable && <div className="w-[8px] h-[8px] rounded-full bg-white" />}
              </div>
              <span className="font-jakarta text-[12px] text-[#333333]">Available</span>
            </label>
            <label className="flex items-center gap-[8px] cursor-pointer">
              <div
                onClick={() => setIsAvailable(false)}
                className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center cursor-pointer ${!isAvailable ? "border-[#2E7D32] bg-[#2E7D32]" : "border-[#9B9B9B]"}`}
              >
                {!isAvailable && <div className="w-[8px] h-[8px] rounded-full bg-white" />}
              </div>
              <span className="font-jakarta text-[12px] text-[#333333]">Out of Stock</span>
            </label>
          </div>
        </div>

        {/* Sale type — only shown for add */}
        {mode === "add" && (
          <div>
            <label className="font-jakarta text-[13px] font-semibold text-[#333333] tracking-[-0.04em] mb-[10px] block">
              Product sale type <span className="text-[#FDC500]">*</span>
            </label>
            <div className="flex items-center gap-[24px]">
              <label className="flex items-center gap-[8px] cursor-pointer">
                <div
                  onClick={() => setSaleType("PREORDER")}
                  className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center cursor-pointer ${saleType === "PREORDER" ? "border-[#2E7D32] bg-[#2E7D32]" : "border-[#9B9B9B]"}`}
                >
                  {saleType === "PREORDER" && <div className="w-[8px] h-[8px] rounded-full bg-white" />}
                </div>
                <span className="font-jakarta text-[12px] text-[#333333]">Preorder</span>
              </label>
              <label className="flex items-center gap-[8px] cursor-pointer">
                <div
                  onClick={() => setSaleType("IN_STOCK")}
                  className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center cursor-pointer ${saleType === "IN_STOCK" ? "border-[#2E7D32] bg-[#2E7D32]" : "border-[#9B9B9B]"}`}
                >
                  {saleType === "IN_STOCK" && <div className="w-[8px] h-[8px] rounded-full bg-white" />}
                </div>
                <span className="font-jakarta text-[12px] text-[#333333]">In Stock</span>
              </label>
            </div>
          </div>
        )}

        {/* Image upload — only shown for add */}
        {mode === "add" && (
          <div>
            <label className="font-jakarta text-[13px] font-semibold text-[#333333] tracking-[-0.04em] mb-[10px] block">
              Upload product image <span className="text-[#FDC500]">*</span>
            </label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            {imagePreview ? (
              <div className="relative w-full h-[160px] rounded-[8px] overflow-hidden border border-[#EAEAEA]">
                <Image src={imagePreview} alt="Product preview" fill className="object-cover" sizes="350px" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-[8px] right-[8px] w-[28px] h-[28px] rounded-full bg-white/80 flex items-center justify-center"
                >
                  <X size={14} className="text-[#E53935]" />
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="font-jakarta text-[13px] font-semibold text-[#2E7D32] underline tracking-[-0.04em]"
                >
                  + Click to upload product image
                </button>
                <p className="font-jakarta text-[12px] text-[#9B9B9B] leading-[1.5] mt-[6px] tracking-[-0.04em]">
                  Ensure product is on a contrasting background, e.g if product is dark in color, place on bright background and vice versa.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors mt-[8px]"
        >
          {submitting ? "Saving..." : mode === "add" ? "Add Product" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Product list card ──────────────────────────────────────────────────────

function ProductCard({ product, onEdit, onDelete }: {
  product: VendorProduct;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const img = product.imageUrls?.[0];
  return (
    <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px] relative">
      {/* Action buttons */}
      <div className="absolute top-[14px] right-[14px] flex items-center gap-[8px]">
        <button
          type="button"
          aria-label="Edit product"
          onClick={onEdit}
          className="w-[32px] h-[32px] rounded-full bg-[#D8FFDA] flex items-center justify-center"
        >
          <Pencil size={15} className="text-[#2E7D32]" />
        </button>
        <button
          type="button"
          aria-label="Delete product"
          onClick={onDelete}
          className="w-[32px] h-[32px] rounded-full bg-[#FFEBEE] flex items-center justify-center"
        >
          <Trash2 size={15} className="text-[#E53935]" />
        </button>
      </div>

      <div className="flex gap-[12px]">
        {/* Info */}
        <div className="flex-1 min-w-0 pr-[72px]">
          <p className="font-jakarta text-[14px] font-bold text-[#151515] tracking-[-0.04em] mb-[10px]">
            {product.name}
          </p>
          <div className="flex flex-col gap-[4px]">
            <p className="font-jakarta text-[12px] text-[#333333] tracking-[-0.04em]">
              <span className="font-semibold">Category:</span>{" "}
              <span className="text-[#2E7D32]">{product.category?.name ?? "—"}</span>
            </p>
            {product.subCategory && (
              <p className="font-jakarta text-[12px] text-[#333333] tracking-[-0.04em]">
                <span className="font-semibold">Sub-category:</span>{" "}
                <span className="text-[#2E7D32]">{product.subCategory.name}</span>
              </p>
            )}
            <p className="font-jakarta text-[12px] text-[#333333] tracking-[-0.04em]">
              <span className="font-semibold">Quantity:</span>{" "}
              <span className="text-[#2E7D32]">{product.stock}</span>
            </p>
            <p className="font-jakarta text-[12px] text-[#333333] tracking-[-0.04em]">
              <span className="font-semibold">Availability:</span>{" "}
              <span className="text-[#2E7D32]">{product.isAvailable ? "Available" : "Out of Stock"}</span>
            </p>
            <p className="font-jakarta text-[12px] text-[#333333] tracking-[-0.04em]">
              <span className="font-semibold">Type:</span>{" "}
              <span className="text-[#2E7D32]">{product.saleType === "PREORDER" ? "Preorder" : "In Stock"}</span>
            </p>
            <p className="font-jakarta text-[12px] text-[#333333] tracking-[-0.04em]">
              <span className="font-semibold">Price per unit (PPU):</span>{" "}
              <span className="text-[#2E7D32]">{formatNaira(product.price)}</span>
            </p>
          </div>
        </div>

        {/* Image */}
        {img && (
          <div className="w-[90px] h-[100px] rounded-[8px] overflow-hidden shrink-0 self-center relative">
            <Image src={img} alt={product.name} fill className="object-cover" sizes="90px" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function VendorProductsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isMock = user?.id === "mock-vendor-001";

  const [view, setView] = useState<View>("list");
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<VendorProduct | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const { data: products, isLoading } = useQuery<VendorProduct[]>({
    queryKey: ["vendor-products"],
    queryFn: async () => {
      const { data } = await apiClient.get("/products/me");
      return data?.data ?? data ?? [];
    },
    enabled: !isMock,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await apiClient.get("/categories");
      return data?.data ?? data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiClient.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      toast.success("Product deleted.");
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      setDeletingProduct(null);
    },
    onError: () => {
      toast.error("Failed to delete product.");
    },
  });

  const items = isMock ? MOCK_PRODUCTS : (products ?? []);
  const cats = categories ?? [];

  // ── Add / Edit views ──
  if (view === "add") {
    return (
      <ProductForm
        mode="add"
        categories={cats}
        isMock={isMock}
        onBack={() => setView("list")}
        onSuccess={() => {
          setSuccessMessage("Your product has been successfully added to your inventory!");
          setView("list");
          setTimeout(() => setSuccessMessage(""), 100);
        }}
      />
    );
  }

  if (view === "edit" && editingProduct) {
    return (
      <ProductForm
        mode="edit"
        product={editingProduct}
        categories={cats}
        isMock={isMock}
        onBack={() => { setView("list"); setEditingProduct(null); }}
        onSuccess={() => {
          setSuccessMessage("Your product has been successfully updated!");
          setView("list");
          setEditingProduct(null);
          setTimeout(() => setSuccessMessage(""), 100);
        }}
      />
    );
  }

  // ── List view ──
  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Mobile header */}
      <div className="md:hidden bg-[#2E7D32] rounded-b-[12px] h-[90px] flex items-center justify-between px-[20px]">
        <Image src="/images/logo.svg" alt="Shopa" width={80} height={30} priority />
        <div className="flex items-center gap-[10px]">
          <Link href="/vendor/notifications" aria-label="Notifications">
            <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
              <Bell size={18} className="text-white" />
            </div>
          </Link>
          <Link href="/vendor/settings" aria-label="Settings">
            <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
              <Settings size={18} className="text-white" />
            </div>
          </Link>
        </div>
      </div>

      {/* Desktop top bar */}
      <div className="hidden md:flex items-center justify-between px-[32px] py-[20px] border-b border-[#EAEAEA] bg-white">
        <h1 className="font-satoshi font-bold text-[20px] text-[#151515]">Products</h1>
        <div className="flex items-center gap-[10px]">
          <Link href="/vendor/notifications" aria-label="Notifications"
            className="w-[36px] h-[36px] rounded-full bg-[#F7FFF8] border border-[#EAEAEA] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors">
            <Bell size={18} className="text-[#2E7D32]" />
          </Link>
          <Link href="/vendor/settings" aria-label="Settings"
            className="w-[36px] h-[36px] rounded-full bg-[#F7FFF8] border border-[#EAEAEA] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors">
            <Settings size={18} className="text-[#2E7D32]" />
          </Link>
        </div>
      </div>

      <div className="px-[20px] md:px-[32px] lg:px-[40px] pt-[20px] pb-[24px]">
        {/* Add button */}
        <div className="flex justify-end mb-[16px]">
          <button
            type="button"
            onClick={() => setView("add")}
            className="bg-[#D8FFDA] rounded-[8px] px-[14px] py-[8px] font-jakarta text-[12px] font-semibold text-[#2E7D32] tracking-[-0.04em]"
          >
            + Add new product
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col gap-[12px]">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px] h-[140px] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-[12px]">
            <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">
              You haven&apos;t added any products yet.
            </p>
            <button
              type="button"
              onClick={() => setView("add")}
              className="bg-[#2E7D32] text-white font-jakarta text-[14px] font-semibold px-[20px] py-[10px] rounded-[8px]"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px]">
            {items.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() => { setEditingProduct(p); setView("edit"); }}
                onDelete={() => setDeletingProduct(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deletingProduct && (
        <DeleteModal
          onClose={() => setDeletingProduct(null)}
          isLoading={deleteMutation.isPending}
          onConfirm={() => {
            if (isMock) { toast.success("Product deleted. (mock)"); setDeletingProduct(null); return; }
            deleteMutation.mutate(deletingProduct.id);
          }}
        />
      )}

      {/* Success modal */}
      {successMessage && (
        <SuccessModal
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}
    </div>
  );
}
