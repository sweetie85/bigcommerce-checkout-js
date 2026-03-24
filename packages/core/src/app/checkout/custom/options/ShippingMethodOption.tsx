import React, { useEffect, useState } from "react";

import { Cart, Consignment, ShippingOption } from '@bigcommerce/checkout-sdk';
import { useCheckout } from "../context/CheckoutContext";

interface ShippingMethodOptionProps {
  updatedShippingOptionId: string | null;
  handleChange: (id: string) => void,
  selectedConsignment: Consignment | null;
}

const ShippingMethodOption = ({ updatedShippingOptionId, handleChange, selectedConsignment }: ShippingMethodOptionProps) => {

  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState(updatedShippingOptionId);
  const { checkoutState } = useCheckout();
  const shippingOptionsAll = checkoutState.data.getShippingOptions() ?? [];
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
      if (!cart) {
        return true;
      }

      if (cart.baseAmount < 300) {
        return !rangeShippingOptions.includes(so.description);
      } else if (cart.baseAmount > 300 && cart.baseAmount <= 1000) {
        return so.description == rangeShippingOptions[0];
      } else if (cart.baseAmount > 1000 && cart.baseAmount <= 2000) {
        return so.description == rangeShippingOptions[1];
      } else if (cart.baseAmount > 2000 && cart.baseAmount <= 3000) {
        return so.description == rangeShippingOptions[2];
      } else if (cart.baseAmount > 3000 && cart.baseAmount <= 4000) {
        return so.description == rangeShippingOptions[3];
      }
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
        <label style={{ marginLeft: '10px' }}>3. Shipping Method:</label>
      </div>
      {shippingOptions.length > 0 ? 
        <div style={{ marginLeft: '30px', marginTop: '6px', border: '1px solid #315B4287', borderRadius: '10px' }}>
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