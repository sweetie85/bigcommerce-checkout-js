import { Cart, Consignment, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { useCheckout } from "../context/CheckoutContext";
import { CheckoutStep } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import FullPageLoader from "../FullPageLoader";
import OrderSummaryItemRow from "../options/OrderSummaryItemRow";

interface OrderSummaryProps {
  checkoutId: string;
  onChangeTab: (index: CheckoutStep) => void;
}

const OrderSummary = ({ checkoutId, onChangeTab }: OrderSummaryProps) => {
  const [mainCartItems, setMainCartItems] = useState<PhysicalItem[]>([]);
  const [shippingTotal, setShippingTotal] = useState<number>(0);

  const [selectedItemIdToDelete, setSelectedItemIdToDelete] = useState<string | number | null>(null);
  const [isInProgress, setIsInProgress] = useState(false);

  const { checkoutState, checkoutService } = useCheckout();
  
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

  const removeCartItem = async (itemId: string | number) => {

    setIsInProgress(true);

    // Delete the item first
    await fetch(`/api/storefront/carts/${checkoutId}/items/${itemId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    })
   
    // Force SDK to refresh its internal state
    await checkoutService.loadCheckout(checkoutId);
    
    setSelectedItemIdToDelete(null);
    setIsInProgress(false);
  };

  return <section className="order-summary relative">
    {isInProgress && <FullPageLoader /> }
    
    <p className="order-summary__title"> Order Summary</p>
    <div className="absolute right-10 -top-2">
      <button onClick={() => { 
        onChangeTab(CheckoutStep.Payment);
        window.scrollTo({ top: 0, behavior: 'smooth'});
      }} className="bg-[#F6A601] py-3 px-12.5 rounded-lg">GO TO PAYMENT</button>
    </div>

    <div className="order-summary__cart-items custom-box-shadow">

    <div className="order-summary__cart-item header text-base!">
      <div className="w-25">Item</div>
      <div className="w-[30%]"></div>
      <div className="w-[30%]">Delivery Address</div>
      <div className="w-[20%]">Ship Date and Method</div>
      <div className="w-[10%]">Price</div>
    </div>

      { consignments.map(c => <div className="order-summary__consignment">
        {mainCartItems.filter(i => c.lineItemIds.includes(i.id as string))
        .map((i, index) => <OrderSummaryItemRow i={i} c={c} index={index}
          setIsInProgress={setIsInProgress}
          setSelectedItemIdToDelete={setSelectedItemIdToDelete}
        />)}
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

    <ConfirmDialog 
      isOpen={!!selectedItemIdToDelete} 
      message="Are you sure you want to remove this item?" 
      onConfirm={() => { 
        removeCartItem(selectedItemIdToDelete as string);
      }}
      onCancel={() => setSelectedItemIdToDelete(null)}
      />
  </section>
}

export default OrderSummary;