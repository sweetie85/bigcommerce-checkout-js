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

  return <div style={{ marginTop: '40px' }}>
    <div className="desktop-only">
      <p className="title"> Cart Summary ({mainCartItems.length} Items)</p>
      <hr className="" style={{ borderColor: '#315B42', marginBottom: '20px'}} />

      <div className="cart-items custom-box-shadow">
        { cart ?
        (mainCartItems.map(i => <div key={i.id} className="cart-item">
          <div style={{ width: '20%' }}><img src={i.imageUrl} /></div>
          <div style={{ width: '60%' }}>
            <div className="product-title" style={{ fontSize: '14px' }}>{i.quantity} x {i.name}</div>
            {i.options?.map(o => <div key={o.nameId} style={{ fontSize: '14px' }} className="product-option">{o.name} {o.value}</div>)}
          </div>
          <div style={{ width: '20%', fontSize: '14px' }} className="product-price">${(i.salePrice * i.quantity).toFixed(2)}</div>
        </div>))
        : <></>
        }
      </div>
    </div>

    <div style={{ marginTop: '10px' }}>
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

      <hr style={{ borderColor: '#315B42'}} />

      <div className="cart-amount-line">
        <span style={{ fontSize: '18px' }}>Total (USD)</span>
        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>${cartTotalAmount()}</span>
      </div>
    </div>

    <CouponCodeBlock />
  </div>
}

export default CartSummary;