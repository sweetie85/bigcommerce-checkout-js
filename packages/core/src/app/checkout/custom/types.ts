import { AddressRequestBody, PhysicalItem } from "@bigcommerce/checkout-sdk";

export enum CheckoutStep {
  Consignment = 'consignment',
  OrderSummary = 'order_summary',
  Payment = 'payment'
}

export interface CustomItem {
  itemIndex: number;
  item: PhysicalItem;
}

export interface GiftProduct {
  bigcommerce_product_id: string;
  product_sku: string; 
  frontend_title: string;
  message_characters_limit: number;
}

export interface CustomAddressRequestBody extends AddressRequestBody {
  email?: string;
}