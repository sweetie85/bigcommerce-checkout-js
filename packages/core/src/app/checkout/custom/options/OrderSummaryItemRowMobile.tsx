import React, { useState } from "react";
import { Consignment, PhysicalItem } from "@bigcommerce/checkout-sdk";
import { formatAddress } from "../../custom-utility";
import { formatedDate } from "../utility";
import ShippingMethodOptionGroup from "./ShippingMethodOptionGroup";
import { useCheckout } from "../context/CheckoutContext";

interface OrderSummaryItemRowMobileProps {
  i: PhysicalItem;
  c: Consignment;
  index: number;
  setIsInProgress: (isSet: boolean) => void;
  setSelectedItemIdToDelete: (id: string | number | null) => void
  isLoading: boolean;
}

const ItemTitle = ({ i }: { i: PhysicalItem; }) => {
  const [isViewDetails, setIsViewDetails] = useState(false);
  return <>
    <div className="product-title">{i.quantity} x {i.name}</div>
    {!isViewDetails && <a className="text-[#315B42] text-xs underline" onClick={() => setIsViewDetails(true)}>Order Details</a>}
    {isViewDetails &&
      <div>
        {/* Hide Count from Cart and Checkout */}
        {i.options?.filter(o => o.name != 'Count').map(o => <div key={o.nameId} className="product-option">{o.name}: {o.value}</div>)}
      </div>
    }
  </>
}

const OrderSummaryItemRowMobile = ({ i, c, index, isLoading, setIsInProgress, setSelectedItemIdToDelete }: OrderSummaryItemRowMobileProps) => {
  return <div key={i.id}>
    <div key={i.id} className="order-summary__cart-item relative max-md:gap-2!">
      <div className="w-[10%]"><img src={i.imageUrl} /></div>
      <div className="w-[80%]">

        <ItemTitle i={i}/>

        <div className="flex gap-1 items-center mt-2">
          <span onClick={() => setSelectedItemIdToDelete(i.id) } className="cursor-pointer underline">Remove</span>
          <svg onClick={() => setSelectedItemIdToDelete(i.id) } className="cursor-pointer" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 6h18"/>
            <path d="M8 6V4h8v2"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v5"/>
            <path d="M14 11v5"/>
          </svg>
        </div>
      </div>

      <div className="product-price w-[10%] flex flex-col gap-5">
        <div className="min-h-12">${(i.salePrice * i.quantity).toFixed(2)}</div>
        {/* {(index == 0 && c.selectedShippingOption) && <div>${c.selectedShippingOption?.cost}</div>} */}
      </div>
    </div>
  </div>
}

  export default OrderSummaryItemRowMobile;
