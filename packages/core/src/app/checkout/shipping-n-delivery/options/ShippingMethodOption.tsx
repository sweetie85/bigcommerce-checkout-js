import React, { useEffect, useState } from "react";

import { Consignment, ShippingOption } from '@bigcommerce/checkout-sdk';
import { useCheckout } from "../CheckoutContext";

interface ShippingMethodOptionProps {
  updatedShippingOptionId: string | null;
  handleChange: (id: string) => void,
  selectedConsignment: Consignment | null;
}

const ShippingMethodOption = ({ updatedShippingOptionId, handleChange, selectedConsignment }: ShippingMethodOptionProps) => {

  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState(updatedShippingOptionId);
  const { state: checkoutState } = useCheckout();
  const shippingOptions = checkoutState.data.getShippingOptions() ?? [];


  useEffect(() => {
    if (selectedConsignment && selectedConsignment.selectedShippingOption) {
      setSelectedShippingOptionId(selectedConsignment.selectedShippingOption.id)
    }
  }, [selectedConsignment]);

  return <div style={{ display: 'flex', gap: '20px' }}>
    <div style={{ width: '60%'}}>
      <div className="step-title">
        <label style={{ marginLeft: '10px' }}>3. Shipping Method:</label>
      </div>
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
    </div>
    <div style={{ width: '40%'}}>
      
    </div>
  </div>
}

export default ShippingMethodOption;