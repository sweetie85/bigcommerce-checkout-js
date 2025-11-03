import { AddressRequestBody, Cart, CheckoutStoreSelector, ShippingOption } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { formatAddress } from "./custom-utility";

interface CartSummaryProps {
  data: CheckoutStoreSelector;
  cart: Cart | undefined;
}

const OrderSummary = ({ cart, data }: CartSummaryProps) => {

  const [shippingAddress, setShippingAddress] = useState<AddressRequestBody | null>(null);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  
  useEffect(() => {
    const customerShippingAddress = data.getShippingAddress();
    if (customerShippingAddress) {
      setShippingAddress(customerShippingAddress);
    }

    const selectedShippingOption = data.getSelectedShippingOption();
    if (selectedShippingOption) {
      setSelectedShippingOption(selectedShippingOption)
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
    <p className="title" style={{ textAlign: 'center' }}> Order Summary</p>
    <div className="cart-items">
      <div className="cart-item" style={{ fontWeight: 'bold' }}>
        <div style={{ width: '100px' }}>Item</div>
        <div style={{ width: '30%' }}></div>
        <div style={{ width: '30%' }}>Delivery Address</div>
        <div style={{ width: '20%' }}>Ship Date</div>
        <div style={{ width: '10%', textAlign: 'right' }}>Price</div>
      </div>

      { cart ?
       (cart.lineItems.physicalItems.map(i => <div key={i.id}>
        <hr style={{ borderColor: '#315B42'}} />
        <div key={i.id} className="cart-item">
          <div style={{ width: '100px' }}><img src={i.imageUrl} /></div>
          <div style={{ width: '30%' }}>
            <div className="product-title">{i.quantity} x {i.name}</div>
            {i.options?.map(o => <div key={o.nameId} className="product-option">{o.name} {o.value}</div>)}
          </div>
          <div style={{ width: '30%' }}>
            {shippingAddress ? formatAddress(shippingAddress) : ''}
          </div>
          <div style={{ width: '20%' }}>
            {selectedShippingOption ? selectedShippingOption.description : ''}
          </div>
          <div style={{ width: '10%' }} className="product-price">${i.salePrice}</div>
        </div>
      </div>))
      : <></>
      }
    </div>

    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
      <p style={{ width: '40%', fontWeight: 'bold' }}>*Please review your order carefully-due to our baking schedule, changes cannot be made once orders are submitted. Thank you for understanding!</p>
      <div style={{ width: '40%' }}>
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
  </div>
}

export default OrderSummary;