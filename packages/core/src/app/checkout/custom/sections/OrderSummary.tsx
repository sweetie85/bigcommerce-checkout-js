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

  const { checkoutState } = useCheckout();
  
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
  }, []);

  const cartTotalAmount = () => {
    let totalAmount = cart ? cart.cartAmount : 0;
    if (shippingTotal) {
      totalAmount = totalAmount + shippingTotal;
    }

    return totalAmount.toFixed(2);
  }

  return <section className="order-summary">
    <p className="order-summary__title"> Order Summary</p>
    <div className="order-summary__cart-items custom-box-shadow">

    <div className="order-summary__cart-item header">
      <div style={{ width: '100px' }}>Item</div>
      <div style={{ width: '30%' }}></div>
      <div style={{ width: '30%' }}>Delivery Address</div>
      <div style={{ width: '20%' }}>Ship Method and Date</div>
      <div style={{ width: '10%' }}>Price</div>
    </div>

      { consignments.map(c => <div className="order-summary__consignment">
        {mainCartItems.filter(i => c.lineItemIds.includes(i.id as string))
        .map((i, index) => <div key={i.id}>
          
          <div key={i.id} className="order-summary__cart-item">
            <div style={{ width: '100px' }}><img src={i.imageUrl} /></div>
            <div style={{ width: '30%' }}>
              <div className="product-title">{i.quantity} x {i.name}</div>
              {i.options?.map(o => <div key={o.nameId} className="product-option">{o.name} {o.value}</div>)}
            </div>
            
            <div style={{ width: '30%' }}>
              {index == 0 && formatAddress(c.address)}
            </div>

            <div style={{ width: '20%' }}>
              {index == 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ minHeight: '50px' }}>{c.address.customFields[0] && c.address.customFields[0].fieldId == 'field_26' ? formatedDate(c.address.customFields[0].fieldValue as string) : ''}</div>
                <div>{c.selectedShippingOption?.description}</div>
              </div>}
            </div>

            <div style={{ width: '10%', display: 'flex', flexDirection: 'column', gap: '20px' }} className="product-price">
              <div style={{ minHeight: '50px' }}>${(i.salePrice * i.quantity).toFixed(2)}</div>
              {index == 0 && <div>${c.selectedShippingOption?.cost}</div>}
            </div>
          </div>
        </div>)}
      </div>
      )}
    
      <hr style={{ borderColor: '#315B42'}} />

      <div className="order-summary__footer">
        <p style={{ width: '40%', fontWeight: 'bold' }}>
        </p>

        <div className="cart-summary" style={{ padding: 0 }}>
          <div className="cart-amount-line" style={{ paddingTop: 0 }}>
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
      </div>

      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'right', alignItems: 'end' }}>
        <button onClick={() => { onChangeTab(CheckoutStep.Payment) }} style={{ backgroundColor: '#F6A601', padding: '12px 50px', marginTop: '30px', borderRadius: '8px' }}>GO TO PAYMENT</button>
        <p style={{ width: '40%', marginTop: '20px', textAlign: 'left' }}>*Please review your order carefully-due to our baking schedule, changes cannot be made once orders are submitted. Thank you for understanding!</p>
      </div>
    </div>
  </section>
}

export default OrderSummary;