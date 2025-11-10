import { AddressRequestBody, CheckoutStoreSelector } from "@bigcommerce/checkout-sdk";
import React, { ReactNode, useEffect, useState } from "react";

interface CheckoutPaymentProps {
  data: CheckoutStoreSelector;
  checkoutId: string;
  paymentForm: ReactNode;
}

const CheckoutPayment = ({ data, checkoutId, paymentForm } :CheckoutPaymentProps) => {

  const [billingAddress, setBillingAddress] = useState<AddressRequestBody | null>(null);
  
  // Next page
  const [enabledNextStep, setEnabledNextStep] = useState(true);

  useEffect(() => {
    const customerShippingAddress = data.getBillingAddress();
    if (customerShippingAddress) {
      setBillingAddress(customerShippingAddress);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setBillingAddress({
        ...billingAddress,
        [e.target.name]: e.target.value,
      } as AddressRequestBody);
    };

  return <div style={{ margin: '0 30px' }}>
    <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>Billing & Payment Information</p>

    <div style={{ backgroundColor: '#fff', padding: '30px 40px' }}>
      <p style={{ fontSize: '16px', fontWeight: 'bold'}}>Check out faster with:</p>

      <p style={{fontSize: '16px', fontWeight: 'bold'}}>Billing Address: </p>
      <div style={{ padding: '0 30px' }}>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="First Name" name="firstName" value={billingAddress?.firstName} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Last Name" name="lastName" value={billingAddress?.lastName} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="Company Name" name="company" value={billingAddress?.company} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Phone Number" name="phone" value={billingAddress?.phone} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="Address" name="address1" value={billingAddress?.address1} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Address/Suite/Building" name="address2" value={billingAddress?.address2} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="City" name="city" value={billingAddress?.city} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Country" name="countryCode" value={billingAddress?.countryCode} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="State/Province" name="stateOrProvince" value={billingAddress?.stateOrProvince} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Postal Code" name="postalCode" value={billingAddress?.postalCode} onChange={handleInputChange} />
        </div>
      </div>

      <p style={{fontSize: '16px', fontWeight: 'bold', marginTop: '20px'}}>Payment: </p>
      { paymentForm }


      <div style={{ margin: '0 30px' }}>
        <button disabled={!enabledNextStep} style={{ opacity: enabledNextStep ? '1' : '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>PLACE YOUR ORDER</button>
      </div>
    </div>
  </div>
}

export default CheckoutPayment;