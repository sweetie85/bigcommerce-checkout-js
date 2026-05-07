import { Cart, Consignment, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { formatAddress } from "../../custom-utility";
import { useCheckout } from "../context/CheckoutContext";
import { CheckoutStep } from "../types";
import { formatedDate } from "../utility";

interface OrderSummaryProps {
  onChangeTab: (index: CheckoutStep) => void;
}

const OrderSummary = ({ onChangeTab }: OrderSummaryProps) => {
  const [mainCartItems, setMainCartItems] = useState<PhysicalItem[]>([]);
  const [shippingTotal, setShippingTotal] = useState<number>(0);

  const { checkoutState, storeConfig } = useCheckout();
  const { futureShipDateFieldId: FUTURE_SHIP_DATE_FIELD_ID } = storeConfig;
  
  const cart: Cart | undefined = checkoutState.data.getCart();
  const consignments: Consignment[] | undefined = checkoutState.data.getConsignments() ?? [];

  useEffect(() => {
    let shippingTotal = 0;
    for(let i = 0; i < consignments.length; i++) {
      shippingTotal += consignments[i].shippingCost;
    }

    setShippingTotal(shippingTotal);

    if (cart) {
      const mainItems = cart.lineItems.physicalItems.filter(c => !c.parentId);
      setMainCartItems(mainItems);
    }
  }, [consignments]);

  const cartTotalAmount = () => {
    let totalAmount = cart ? cart.cartAmount : 0;
    if (shippingTotal) {
      totalAmount = totalAmount + shippingTotal;
    }

    return totalAmount.toFixed(2);
  }

  return <section className="order-summary relative">
    <p className="order-summary__title"> Order Summary</p>
    <div className="absolute right-10 -top-2">
      <button onClick={() => { 
        onChangeTab(CheckoutStep.Payment);
        window.scrollTo({ top: 0, behavior: 'smooth'});
      }} className="bg-[#F6A601] py-3 px-12.5 rounded-lg">GO TO PAYMENT</button>
    </div>

    <div className="order-summary__cart-items custom-box-shadow">

    <div className="order-summary__cart-item header">
      <div className="w-25">Item</div>
      <div className="w-[30%]"></div>
      <div className="w-[30%]">Delivery Address</div>
      <div className="w-[20%]">Ship Date and Method</div>
      <div className="w-[10%]">Price</div>
    </div>

      { consignments.map(c => <div className="order-summary__consignment">
        {mainCartItems.filter(i => c.lineItemIds.includes(i.id as string))
        .map((i, index) => <div key={i.id}>
          
          <div key={i.id} className="order-summary__cart-item">
            <div className="w-25"><img src={i.imageUrl} /></div>
            <div className="w-[30%]">
              <div className="product-title">{i.quantity} x {i.name}</div>
              {i.options?.map(o => <div key={o.nameId} className="product-option">{o.name} {o.value}</div>)}
            </div>
            
            <div className="w-[30%]">
              {index == 0 && formatAddress(c.address)}
            </div>

            <div className="w-[20%]">
              {index == 0 && <div className="flex flex-col gap-5">
                <div className="min-h-12">
                  {c.address.customFields[0] && c.address.customFields[0].fieldId == FUTURE_SHIP_DATE_FIELD_ID && c.address.customFields[0].fieldValue != '' ? formatedDate(c.address.customFields[0].fieldValue as string) : 'No Shipping date (standard)'}
                </div>
                <div>{c.selectedShippingOption?.description}</div>
              </div>}
            </div>

            <div className="product-price w-[10%] flex flex-col gap-5">
              <div className="min-h-12">${(i.salePrice * i.quantity).toFixed(2)}</div>
              {index == 0 && <div>${c.selectedShippingOption?.cost}</div>}
            </div>
          </div>
        </div>)}
      </div>
      )}
    
      <hr className="border-[#315B42]" />

      <div className="order-summary__footer">
        <p className="w-2/5 font-bold">
        </p>

        <div className="cart-summary p-0">
          <div className="cart-amount-line pt-0">
            <span>Subtotal</span>
            <span>${cart?.baseAmount}</span>
          </div>
          <div className="cart-amount-line">
            <span>Shipping</span>
            <span>{ shippingTotal || shippingTotal === 0 ? '$'+shippingTotal.toFixed(2) : 'TBD' }</span>
          </div>
          <div className="cart-amount-line">
            <span>Tax</span>
            <span>$0.00</span>
          </div>

          <hr className="border-[#315B42]" />

          <div className="cart-amount-line">
            <span className="text-lg">Total (USD)</span>
            <span className="text-xl font-bold">${cartTotalAmount()}</span>
          </div>
        </div>
      </div>

      { mainCartItems.length > 0 &&
        <div className="text-right flex flex-col justify-end items-end">
          <button onClick={() => { 
            onChangeTab(CheckoutStep.Payment);
            window.scrollTo({ top: 0, behavior: 'smooth'});
          }} className="bg-[#F6A601] py-3 px-12 mt-7 rounded-lg">GO TO PAYMENT</button>
          <p className="w-[40%] mt-5 text-left text-[#f6a601]">*Please review your order carefully-due to our baking schedule, changes cannot be made once orders are submitted. Thank you for understanding!</p>
        </div>
      }
    </div>
  </section>
}

export default OrderSummary;