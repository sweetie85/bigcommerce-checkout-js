import React, { useEffect, useState } from "react";

import { Consignment, ShippingOption } from '@bigcommerce/checkout-sdk';
import { useCheckout } from "../CheckoutContext";

interface ShippingMethodOptionProps {
  updatedShippingOptionId: string | null;
  handleChange: (id: string) => void,
  selectedConsignment: Consignment | null;
}

const ShippingMethodOptionGroup = ({ updatedShippingOptionId, handleChange, selectedConsignment }: ShippingMethodOptionProps) => {

  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState(updatedShippingOptionId);
  const { checkoutState } = useCheckout();
  const shippingOptions = checkoutState.data.getShippingOptions() ?? [];

  useEffect(() => {
    if (selectedConsignment && selectedConsignment.selectedShippingOption) {
      setSelectedShippingOptionId(selectedConsignment.selectedShippingOption.id)
    }
  }, [selectedConsignment]);

  useEffect(() => {
    setSelectedShippingOptionId(updatedShippingOptionId);
  }, [updatedShippingOptionId]);

  return <div>
    <select style={{ width: '300px', padding: '10px' }} onChange={(e) => handleChange(e.target.value)}>
      <option value={0}>Shipping Method</option>
      {shippingOptions.map((so, index) => 
        <option value={so.id}>{so.description} - ${so.cost}</option>
      )}
    </select>
  </div>
}

export default ShippingMethodOptionGroup;