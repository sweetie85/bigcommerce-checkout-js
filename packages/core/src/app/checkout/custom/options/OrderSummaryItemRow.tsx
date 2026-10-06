import React, { useState } from "react";
import { Consignment, PhysicalItem } from "@bigcommerce/checkout-sdk";
import { formatAddress } from "../../custom-utility";
import { formatedDate } from "../utility";
import ShippingMethodOptionGroup from "./ShippingMethodOptionGroup";
import { useCheckout } from "../context/CheckoutContext";

interface OrderSummaryItemRowProps {
  i: PhysicalItem;
  c: Consignment;
  index: number;
  setIsInProgress: (isSet: boolean) => void;
  setSelectedItemIdToDelete: (id: string | number | null) => void
}

const OrderSummaryItemRow = ({ i, c, index, setIsInProgress, setSelectedItemIdToDelete }: OrderSummaryItemRowProps) => {
  const [isEditShipping, setIsEditShipping] = useState(false);

  const { storeConfig, checkoutService } = useCheckout();
  const { futureShipDateFieldId: FUTURE_SHIP_DATE_FIELD_ID } = storeConfig;
  
  const saveShippingMethod = async (shippingMethodId: string) => {
    setIsInProgress(true);
    await checkoutService.selectConsignmentShippingOption(c.id, shippingMethodId);
    setIsInProgress(false);
    setIsEditShipping(false)
  }
  
  return <div key={i.id}>
    <div key={i.id} className="order-summary__cart-item relative">
      <div className="w-25"><img src={i.imageUrl} /></div>
      <div className="w-[30%]">
        <div className="product-title">{i.quantity} x {i.name}</div>
        {/* Hide Count from Cart and Checkout */}
        {i.options?.filter(o => o.name != 'Count').map(o => <div key={o.nameId} className="product-option">{o.name}: {o.value}</div>)}

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
      
      <div className="w-[30%]">
        {index == 0 && formatAddress(c.address)}
      </div>

      <div className="w-[20%]">
        {index == 0 && <div className="flex flex-col gap-5">
          <div className="min-h-12">
            {c.address.customFields[0] && c.address.customFields[0].fieldId == FUTURE_SHIP_DATE_FIELD_ID && c.address.customFields[0].fieldValue != '' ? formatedDate(c.address.customFields[0].fieldValue as string) : 'No Shipping date (standard)'}
          </div>

          {/* Check if shipping option is availble */}
          {c.selectedShippingOption && !isEditShipping ?
            <div className="flex gap-2 items-center">
              <span>{c.selectedShippingOption?.description}</span>
              <span>
                <svg
                  className="mt-1 cursor-pointer"
                  onClick={() => setIsEditShipping(true)}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
              </span>
            </div>
          :
            <div>
              {/* Select shipping option */}
              <ShippingMethodOptionGroup selectedConsignment={c} handleChange={(id) => {
                if (id) {
                  saveShippingMethod(id);
                }
              }} />
              { isEditShipping && <div className="mt-2">
                <button className="underline" onClick={() => setIsEditShipping(false)}>Cancel</button>
              </div>}
            </div>
          }
          
        </div>}
      </div>

      <div className="product-price w-[10%] flex flex-col gap-5">
        <div className="min-h-12">${(i.salePrice * i.quantity).toFixed(2)}</div>
        {(index == 0 && c.selectedShippingOption) && <div>${c.selectedShippingOption?.cost}</div>}
      </div>
    </div>
  </div>
}

  export default OrderSummaryItemRow;
