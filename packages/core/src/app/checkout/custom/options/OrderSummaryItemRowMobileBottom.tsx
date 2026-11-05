import React, { useState } from "react";
import { Consignment, PhysicalItem } from "@bigcommerce/checkout-sdk";
import { formatAddress } from "../../custom-utility";
import { formatedDate } from "../utility";
import ShippingMethodOptionGroup from "./ShippingMethodOptionGroup";
import { useCheckout } from "../context/CheckoutContext";

interface OrderSummaryItemRowProps {
  c: Consignment;
  setIsInProgress: (isSet: boolean) => void;
  setSelectedItemIdToDelete: (id: string | number | null) => void
  isLoading: boolean;
}

const OrderSummaryItemRowMobileBottom = ({ c, isLoading, setIsInProgress, setSelectedItemIdToDelete }: OrderSummaryItemRowProps) => {
  const [isEditShipping, setIsEditShipping] = useState(false);

  const { storeConfig, checkoutService } = useCheckout();
  const { futureShipDateFieldId: FUTURE_SHIP_DATE_FIELD_ID } = storeConfig;
  
  const saveShippingMethod = async (shippingMethodId: string) => {
    setIsInProgress(true);
    await checkoutService.selectConsignmentShippingOption(c.id, shippingMethodId);
    setIsInProgress(false);
    setIsEditShipping(false)
  }
  
  return <div>
    <div className="order-summary__cart-item relative max-md:gap-2!">
      
      <div className="w-[45%]">
        <p className="font-bold text-xs mb-1">Delivery Address</p>
        {formatAddress(c.address)}
      </div>

      <div className="w-[45%]">
        <p className="font-bold text-xs mb-1">Ship Date & Method</p>
        <div className="flex flex-col gap-2">
          <div className="min-h-12">
            {c.address.customFields[0] && c.address.customFields[0].fieldId == FUTURE_SHIP_DATE_FIELD_ID && c.address.customFields[0].fieldValue != '' ? formatedDate(c.address.customFields[0].fieldValue as string) : 'No Shipping date (standard)'}
          </div>

          {/* Check if shipping option is availble */}
          {c.selectedShippingOption && !isEditShipping ?
            <div className="flex gap-1 items-center">
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
            <div className={`${isLoading ? 'hidden' : '' }`}>
              {/* Select shipping option */}
              <ShippingMethodOptionGroup selectedConsignment={c} handleChange={(id) => {
                if (id) {
                  saveShippingMethod(id);
                }
              }} />
              { !c.selectedShippingOption && <p className="text-red-600">Plese select shipping method</p>}
              { isEditShipping && <div className="mt-2">
                <button className="underline" onClick={() => setIsEditShipping(false)}>Cancel</button>
              </div>}
            </div>
          }
          
        </div>
      </div>

      <div className="product-price w-[10%] flex flex-col gap-5">
        {(c.selectedShippingOption) && <div>${c.selectedShippingOption?.cost}</div>}
      </div>
    </div>
  </div>
}

  export default OrderSummaryItemRowMobileBottom;
