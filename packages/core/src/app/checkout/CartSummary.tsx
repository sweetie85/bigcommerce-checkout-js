import { Cart } from "@bigcommerce/checkout-sdk";
import React from "react";

interface CartSummaryProps {
  cart: Cart | undefined;
}

const CartSummary = ({ cart }: CartSummaryProps) => {
  return <div>
    <p className="title"> Cart Summary ({cart ? cart.lineItems.physicalItems.length : 0} Items)</p>
    <div className="cart-items">
      { cart ?
       (cart.lineItems.physicalItems.map(i => <div key={i.id} className="cart-item">
        <div style={{ width: '20%' }}><img src={i.imageUrl} /></div>
        <div style={{ width: '60%' }}>
          <div className="product-title">{i.name}</div>
          {i.options?.map(o => <div key={o.nameId} className="product-option">{o.name} {o.value}</div>)}
        </div>
        <div style={{ width: '20%' }} className="product-price">${i.salePrice}</div>
      </div>))
      : <></>
      }
    </div>

    <div style={{ marginTop: '10px' }}>
      <div className="cart-amount-line">
        <span>Subtotal</span>
        <span>${cart?.baseAmount}</span>
      </div>
      <div className="cart-amount-line">
        <span>Shipping</span>
        <span>TBD</span>
      </div>
      <div className="cart-amount-line">
        <span>Tax</span>
        <span>$0.00</span>
      </div>

      <hr style={{ borderColor: '#315B42'}} />

      <div className="cart-amount-line">
        <span style={{ fontSize: '18px' }}>Total (USD)</span>
        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>${cart?.cartAmount}</span>
      </div>
    </div>
  </div>
}

export default CartSummary;