import React, { useEffect, useState } from "react";

import { Consignment, ShippingOption } from '@bigcommerce/checkout-sdk';
import { useCheckout } from "../context/CheckoutContext";

interface ShippingMethodOptionProps {
  handleChange: (id: string) => void,
  selectedConsignment: Consignment | null;
}

const ShippingMethodOptionGroup = ({ handleChange, selectedConsignment }: ShippingMethodOptionProps) => {

  const { checkoutState } = useCheckout();
  const shippingOptions = checkoutState.data.getShippingOptions() ?? [];

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