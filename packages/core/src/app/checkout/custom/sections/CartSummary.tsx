import { Cart, CheckoutStoreSelector, Consignment, PhysicalItem, ShippingOption } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { useCheckout } from "../context/CheckoutContext";
// import { useShipping } from "../shipping/hooks/useShipping";

const CartSummary = () => {
  const [shippingTotal, setShippingTotal] = useState<number>(0);
  const [mainCartItems, setMainCartItems] = useState<PhysicalItem[]>([]);
  const [isShowPromoCode, setIsShowPromoCode] = useState<boolean>();
  // const { cart, consignments } = useShipping();

  const { checkoutState, checkoutService } = useCheckout();

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

  const applyCoupon = async () => {
    const couponCodeInput = document.getElementById('couponCode') as HTMLInputElement;
    if (couponCodeInput) {
      const couponCode = couponCodeInput.value;
      await checkoutService.applyCoupon(couponCode);

      couponCodeInput.value = '';
      setIsShowPromoCode(false);
    }
  }

  const removeCoupon = async (code: string) => {
    await checkoutService.removeCoupon(code);
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

    <div className="custom-box-shadow bg-white p-4 mt-6 rounded-lg">
      <div>
        <label className="text-lg cursor-pointer" onClick={() => setIsShowPromoCode(!isShowPromoCode)}>Apply a Promo code</label>
      </div>

      { isShowPromoCode && <div className="mt-2 flex gap-2 items-center">
        <input id="couponCode" className="p-2 rounded" type="text"  placeholder="PROMO CODE" />
        <button className="bg-[#F6A601] rounded-lg py-2 px-5" onClick={applyCoupon}>Apply</button>
      </div>}

      <div className="mt-3 flex gap-2">
        { appliedCoupons.map((c) => <div className="flex gap-2 rounded items-center bg-gray-300 p-2">
          <span>{c.code}</span>
          <svg className="max-md:w-5 cursor-pointer" onClick={() => removeCoupon(c.code)} width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14.5" cy="14.5" r="14" fill="#D9D9D9" stroke="#315B42"></circle>
            <path d="M12.7715 9.785L15.2615 13.55H14.7515L17.2265 9.785H19.8665L16.1765 15.185L16.0865 14.48L19.8965 20H17.1965L14.5865 16.1H15.3215L12.7415 20H10.0415L13.8065 14.48L13.8215 15.185L10.1465 9.785H12.7715Z" fill="#315B42"></path>
          </svg>
        </div>) }
      </div>
    </div>
  </div>
}

export default CartSummary;