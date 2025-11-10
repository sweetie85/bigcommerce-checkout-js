import { Cart, CheckoutStoreSelector, PhysicalItem, ShippingOption } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";

interface CartSummaryProps {
  data: CheckoutStoreSelector;
  cart: Cart | undefined;
}

const CartSummary = ({ data, cart }: CartSummaryProps) => {
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [mainCartItems, setMainCartItems] = useState<PhysicalItem[]>([]);

  useEffect(() => {
    const selectedShippingOption = data.getSelectedShippingOption();
    if (selectedShippingOption) {
      setSelectedShippingOption(selectedShippingOption)
    }

    if (cart) {
      const mainItems = cart.lineItems.physicalItems.filter(c => !c.parentId);
      setMainCartItems(mainItems);
    }
  }, []);

  const cartTotalAmount = () => {
    let totalAmount = cart ? cart.cartAmount : 0;
    if (selectedShippingOption) {
      totalAmount = totalAmount + selectedShippingOption.cost;
    }

    return totalAmount;
  }

  return <div>
    <p className="title"> Cart Summary ({mainCartItems.length} Items)</p>
    <div className="cart-items">
      { cart ?
       (mainCartItems.map(i => <div key={i.id} className="cart-item">
        <div style={{ width: '20%' }}><img src={i.imageUrl} /></div>
        <div style={{ width: '60%' }}>
          <div className="product-title">{i.quantity} x {i.name}</div>
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
        <span>{ selectedShippingOption ? '$'+selectedShippingOption.cost : 'TBD' }</span>
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
  </div>
}

export default CartSummary;