'use client';
import NewProductForm from './products/NewProductForm';

interface ProductFormProps {
  market: "HomeCheff" | "HomeGarden" | "HomeDesigner";
}

export default function ProductForm({ market }: ProductFormProps) {
  return <NewProductForm />;
}
