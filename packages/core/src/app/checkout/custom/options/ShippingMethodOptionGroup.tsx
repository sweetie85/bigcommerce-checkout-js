import React, { useEffect, useState } from "react";

import { Cart, Consignment, ShippingOption } from '@bigcommerce/checkout-sdk';
import { useCheckout } from "../context/CheckoutContext";
// import { useCheckout } from "../context/CheckoutContext";

interface ShippingMethodOptionProps {
  handleChange: (id: string) => void,
  selectedConsignment: Consignment | null;
}

const ShippingMethodOptionGroup = ({ handleChange, selectedConsignment }: ShippingMethodOptionProps) => {

  // const { checkoutState } = useCheckout();
  const shippingOptionsAll = selectedConsignment && selectedConsignment.availableShippingOptions ? selectedConsignment.availableShippingOptions : [];

  const { checkoutState } = useCheckout();
  const cart: Cart | undefined = checkoutState.data.getCart();
    
  const rangeShippingOptions = [
    '$300 - $1000 Range',
    '$1000 - $2000 Range',
    '$2000 - $3000 Range',
    '$3000 - $4000 Range'
  ];

  const shippingOptions = shippingOptionsAll
    .filter(so => so.description != 'Pick Up')
    .filter(so => {
      if (!cart || !selectedConsignment) {
        return true;
      }

      const consignmentItems = cart.lineItems.physicalItems.filter(i => !i.parentId && selectedConsignment.lineItemIds.includes(i.id as string));
      let cartTotal = 0;
      for (let i = 0; i < consignmentItems.length; i++) {
        cartTotal += consignmentItems[i].listPrice * consignmentItems[i].quantity;
      }

      if (cartTotal < 300) {
        return !rangeShippingOptions.includes(so.description);
      } else if (cartTotal > 300 && cartTotal <= 1000) {
        return so.description == rangeShippingOptions[0];
      } else if (cartTotal > 1000 && cartTotal <= 2000) {
        return so.description == rangeShippingOptions[1];
      } else if (cartTotal > 2000 && cartTotal <= 3000) {
        return so.description == rangeShippingOptions[2];
      } else if (cartTotal > 3000 && cartTotal <= 4000) {
        return so.description == rangeShippingOptions[3];
      }
    });

  return <div>
    <select className="shipping-option-selector" style={{ padding: '10px' }} onChange={(e) => handleChange(e.target.value)}>
      <option value={''}>Shipping Method</option>
      {shippingOptions.map((so) => 
        <option key={so.id} selected={selectedConsignment?.selectedShippingOption?.id == so.id} value={so.id}>{so.description} - ${so.cost}</option>
      )}
    </select>
  </div>
}

export default ShippingMethodOptionGroup;