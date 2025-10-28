import React from "react";

import { ShippingOption } from '@bigcommerce/checkout-sdk';

interface ShippingMethodOptionProps {
  shippingOptions: ShippingOption[];
  selectedShippingOptionId: string | null;
  handleChange: (id: string) => void
}

const ShippingMethodOption = ({ shippingOptions, selectedShippingOptionId, handleChange }: ShippingMethodOptionProps) => {
  return <div style={{ display: 'flex', gap: '20px' }}>
    <div style={{ width: '60%'}}>
      <div className="step-title">
        <label style={{ marginLeft: '10px' }}>3. Shipping Method:</label>
      </div>
      <div style={{ marginLeft: '30px', marginTop: '6px', border: '1px solid #315B4287', borderRadius: '10px' }}>
        {shippingOptions.map((so, index) => <div key={so.id} style={{ borderBottom: (index != shippingOptions.length - 1) ? '1px solid #315B4287' : '' , padding: '10px', display: 'flex', justifyContent: 'space-between'}}>
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