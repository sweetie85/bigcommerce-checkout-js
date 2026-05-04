import React, { useEffect, useState } from "react";

import { Cart, Consignment, ShippingOption } from '@bigcommerce/checkout-sdk';
import { useCheckout } from "../context/CheckoutContext";

interface ShippingMethodOptionProps {
  showNumbering?: boolean;
  updatedShippingOptionId: string | null;
  handleChange: (id: string) => void,
  selectedConsignment: Consignment | null;
}

const ShippingMethodOption = ({ showNumbering = true, updatedShippingOptionId, handleChange, selectedConsignment }: ShippingMethodOptionProps) => {

  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState(updatedShippingOptionId);
  const { checkoutState } = useCheckout();
  const shippingOptionsAll = checkoutState.data.getShippingOptions() ?? [];
  const cart: Cart | undefined = checkoutState.data.getCart();
  
  const rangeShippingOptionsRates = Array.from({ length: 10 }, (_, i) => {
    return {
      rate: (i + 1) * 50,
      threshold: (i + 1) * 1000
    };
  });

  const customer = checkoutState.data.getCustomer();
  const stepNumber = customer?.isGuest ? 4 : 3;

  const cartTotal = cart ? cart.baseAmount : null;
  const selectedShippingOptionRange = cartTotal === null || cartTotal < 300
    ? null
    : rangeShippingOptionsRates.find(r => {
      if (cartTotal <= 10000) {
        return cartTotal <= r.threshold
      }

      // Cart total is more than 10,000 (Rare case) then max: 500
      return r.rate == 500; 
    });

  const shippingOptions = shippingOptionsAll
    .filter(so => so.description != 'Pick Up')
    .filter(so => {
      if (!cartTotal) {
        return true;
      }

      if (cartTotal < 300) {
        return so.cost < 50;
      }

      return selectedShippingOptionRange 
        ? so.cost == selectedShippingOptionRange.rate 
        : so.cost == 500;
    });

  useEffect(() => {
    if (selectedConsignment && selectedConsignment.selectedShippingOption) {
      setSelectedShippingOptionId(selectedConsignment.selectedShippingOption.id)
    }
  }, [selectedConsignment]);

  useEffect(() => {
    setSelectedShippingOptionId(updatedShippingOptionId);
  }, [updatedShippingOptionId]);

  return <div>
    <div>
      <div className="step-title">
        <label>{showNumbering && <span>{stepNumber}. </span>}Shipping Method:</label>
      </div>
      {shippingOptions.length > 0 ? 
        <div style={{ marginTop: '6px', border: '1px solid #315B4287', borderRadius: '10px' }}>
          {shippingOptions.map((so, index) => <div key={so.id} style={{ cursor: 'pointer', borderBottom: (index != shippingOptions.length - 1) ? '1px solid #315B4287' : '' , padding: '10px', display: 'flex', justifyContent: 'space-between'}}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input checked={selectedShippingOptionId == so.id} onChange={(e) => handleChange(e.target.value)} name="shipping_method" id={"choose_shipping_method_"+so.id} type="radio" value={so.id} />
              <label htmlFor={"choose_shipping_method_"+so.id}>{so.description}</label>
            </div>
            <div>${so.cost}</div>
          </div>
        )}
        </div>
      :
        <div style={{ color: 'red' }}>Please check your shipping address, the current address does not have validated shipping methods.</div>
      }
    </div>
  </div>
}

export default ShippingMethodOption;