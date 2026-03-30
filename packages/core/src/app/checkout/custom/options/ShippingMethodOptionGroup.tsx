import React from "react";

import { Cart, Consignment, ShippingOption } from '@bigcommerce/checkout-sdk';
import { useCheckout } from "../context/CheckoutContext";
// import { useCheckout } from "../context/CheckoutContext";

interface ShippingMethodOptionProps {
  handleChange: (id: string) => void,
  selectedConsignment: Consignment | null;
}

const ShippingMethodOptionGroup = ({ handleChange, selectedConsignment }: ShippingMethodOptionProps) => {
  const shippingOptionsAll = selectedConsignment?.availableShippingOptions ?? [];

  const { checkoutState } = useCheckout();
  const cart: Cart | undefined = checkoutState.data.getCart();

  const rangeShippingOptionsRates = Array.from({ length: 10 }, (_, i) => {
    return {
      rate: (i + 1) * 50,
      threshold: (i + 1) * 1000
    };
  });

  // Generated these rates
  // const rangeShippingOptionsRates = [
  //   { rate: 50, threshold: 1000 },
  //   { rate: 100, threshold: 2000 },
  //   { rate: 150, threshold: 3000 },
  //   { rate: 200, threshold: 4000 },
  //   { rate: 250, threshold: 5000 },
  //   { rate: 300, threshold: 6000 },
  //   { rate: 350, threshold: 7000 },
  //   { rate: 400, threshold: 8000 },
  //   { rate: 450, threshold: 9000 },
  //   { rate: 500, threshold: 10000 },
  // ];

  const cartTotal = !cart || !selectedConsignment
    ? null
    : cart.lineItems.physicalItems
      .filter(item => !item.parentId && selectedConsignment.lineItemIds.includes(item.id as string))
      .reduce((total, item) => total + item.listPrice * item.quantity, 0);

  const selectedShippingOptionRange = cartTotal === null || cartTotal < 300
    ? null
    : rangeShippingOptionsRates.find(r => {
      if (cartTotal <= 10000) {
        return cartTotal <= r.threshold
      }

      // Cart total is more than 10,000/- (Rare case)
      return r.rate == 500; 
    });

  const shippingOptions = shippingOptionsAll
    .filter(so => so.description !== 'Pick Up')
    .filter(so => {
      if (cartTotal === null) {
        return true;
      }

      if (cartTotal < 300) {
        return so.cost < 50;
      }

      return selectedShippingOptionRange 
        ? so.cost == selectedShippingOptionRange.rate 
        : so.cost == 500;
    });

  return <div>
    <select className="shipping-option-selector" style={{ padding: '10px' }} onChange={(e) => handleChange(e.target.value)}>
      <option value={''}>Shipping Method</option>
      {shippingOptions.map((so) => 
        <option key={so.id} selected={selectedConsignment?.selectedShippingOption?.id === so.id} value={so.id}>{so.description} - ${so.cost}</option>
      )}
    </select>
  </div>
}

export default ShippingMethodOptionGroup;
