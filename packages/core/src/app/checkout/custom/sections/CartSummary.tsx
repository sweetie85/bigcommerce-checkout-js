import { Cart, CheckoutStoreSelector, Consignment, PhysicalItem, ShippingOption } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { useCheckout } from "../context/CheckoutContext";
// import { useShipping } from "../shipping/hooks/useShipping";
import CouponCodeBlock from "../components/CouponCode";

const CartSummary = () => {
  const [shippingTotal, setShippingTotal] = useState<number>(0);
  const [mainCartItems, setMainCartItems] = useState<PhysicalItem[]>([]);
  // const { cart, consignments } = useShipping();

  const { checkoutState } = useCheckout();

  const cart: Cart | undefined = checkoutState.data.getCart();
  const consignments: Consignment[] | undefined = checkoutState.data.getConsignments() ?? [];
  const appliedCoupons = checkoutState.data.getCoupons() ?? [];

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
  }, [consignments, cart]);

  const cartTotalAmount = () => {
    let totalAmount = cart ? cart.cartAmount : 0;
    if (shippingTotal) {
      totalAmount = totalAmount + shippingTotal;
    }

    return totalAmount.toFixed(2);
  }

  return <div className="mt-10">
    <div className="desktop-only">
      <p className="title"> Cart Summary ({mainCartItems.length} Items)</p>
      <hr className="border-[#315B42] mb-5" />

      <div className="cart-items custom-box-shadow">
        { cart ?
        (mainCartItems.map(i => <div key={i.id} className="cart-item">
          <div className="w-1/5"><img src={i.imageUrl} /></div>
          <div className="w-3/5">
            <div className="product-title text-sm">{i.quantity} x {i.name}</div>
            {i.options?.map(o => <div key={o.nameId} className="text-sm product-option">{o.name} {o.value}</div>)}
          </div>
          <div className="w-1/5 text-sm product-price">${(i.salePrice * i.quantity).toFixed(2)}</div>
        </div>))
        : <></>
        }
      </div>
    </div>

    <div className="mt-2.5">
      <div className="cart-amount-line">
        <span>Subtotal</span>
        <span>${cart?.baseAmount}</span>
      </div>
      <div className="cart-amount-line">
        <span>Shipping</span>
        <span>{ shippingTotal || shippingTotal === 0 ? '$'+shippingTotal.toFixed(2) : 'TBD' }</span>
      </div>
      {appliedCoupons.length > 0 &&
        <div className="cart-amount-line">
          <span>Discount</span>
          <span>-${appliedCoupons[0].discountedAmount.toFixed(2)}</span>
        </div>
      }
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

    <CouponCodeBlock />
  </div>
}

export default CartSummary;