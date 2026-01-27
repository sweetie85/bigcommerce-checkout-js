import React, { useEffect, useState } from "react";

import { Consignment, ShippingOption } from '@bigcommerce/checkout-sdk';
import { useCheckout } from "../CheckoutContext";

interface ShippingMethodOptionProps {
  handleChange: (id: string) => void,
  selectedConsignment: Consignment | null;
}

const ShippingMethodOptionGroup = ({ handleChange, selectedConsignment }: ShippingMethodOptionProps) => {

  const { checkoutState } = useCheckout();
  const shippingOptions = checkoutState.data.getShippingOptions() ?? [];

  return <div>
    <select style={{ width: '300px', padding: '10px' }} onChange={(e) => handleChange(e.target.value)}>
      <option value={0}>Shipping Method</option>
      {shippingOptions.map((so, index) => 
        <option selected={selectedConsignment?.selectedShippingOption?.id == so.id} value={so.id}>{so.description} - ${so.cost}</option>
      )}
    </select>
  </div>
}

export default ShippingMethodOptionGroup;