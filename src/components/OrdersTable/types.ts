export interface Order {
  id: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    id?: string;
  };
  status: 'NEW' | 'READY' | 'PRINTED' | 'SHIPPED' | 'PROBLEMATIC' | 'COMPLETED';
  created_at: string;
  products: {
    name: string;
    quantity: number;
    sku?: string;
    variant_title?: string;
    vendor?: string;
    unit_price?: number;
    total_price?: number;
    properties?: Record<string, string>;
  }[];
  total_weight: number;
  package_height: number;
  package_width: number;
  package_length: number;
  package_weight: number;
  tracking_number?: string;
  shipping_address?: {
    address1?: string;
    address2?: string;
    city?: string;
    district?: string;
    province?: string;
    zip?: string;
    country?: string;
    phone?: string;
    name?: string;
    company?: string;
  };
  billing_address?: {
    address1?: string;
    address2?: string;
    city?: string;
    district?: string;
    province?: string;
    zip?: string;
    country?: string;
    name?: string;
    company?: string;
  };
  total_price?: number;
  subtotal_price?: number;
  total_tax?: number;
  total_discounts?: number;
  shipping_lines?: {
    title?: string;
    price?: number;
    code?: string;
  }[];
  note?: string;
  tags?: string[];
  source_name?: string;
  financial_status?: string;
}

export interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onOrderUpdate: () => void;
}

export interface SenderAddress {
  id: number;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  district: string;
  province: string;
  zip: string;
  country: string;
  phone: string;
  company?: string;
  is_default: boolean;
}

export interface ProductFilter {
  product: string;
  quantity: number;
}

export interface ProductQuantityFilters {
  [product: string]: number | null;
} 