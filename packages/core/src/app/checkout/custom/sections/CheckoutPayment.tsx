import { AddressRequestBody, CheckoutStoreSelector } from "@bigcommerce/checkout-sdk";
import React, { ReactNode, useEffect, useState } from "react";
import { useCheckout } from "../context/CheckoutContext";
import PaymentOptionsImage from "../../../../static/payment-gateways.png"
import FullPageLoader from "../FullPageLoader";

interface CheckoutPaymentProps {
  checkoutId: string;
  paymentForm: ReactNode;
}

const CheckoutPayment = ({ checkoutId, paymentForm } :CheckoutPaymentProps) => {

  const [billingAddress, setBillingAddress] = useState<AddressRequestBody | null>(null);
  const [isInProgress, setIsInProgress] = useState(false);

  const { checkoutService, checkoutState } = useCheckout();
  const savedBillingAddress = checkoutState.data.getBillingAddress();

  useEffect(() => {
    if (savedBillingAddress) {
      setBillingAddress(savedBillingAddress);
    } else {
      setBillingAddress(null);
    }
  }, [savedBillingAddress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setBillingAddress({
        ...billingAddress,
        [e.target.name]: e.target.value,
      } as AddressRequestBody);
    };

  const updateBillingAddress = async () => {
    if (billingAddress) {
      setIsInProgress(true);
      
      await checkoutService.updateBillingAddress(billingAddress);
      // console.log('Billing address updated.');

      setIsInProgress(false);
    }
  }

  return <section className="payment-page">
    {isInProgress && <FullPageLoader /> }
    
    <p className="payment-page__title">Billing & Payment Information</p>
    <div className="payment-page__wrapper">
      <div>
        <div style={{ fontSize: '16px', fontWeight: 'bold'}}>Check out faster with:</div>
        <div>
          <img style={{ width: '70%' }} src={PaymentOptionsImage} alt="Payment options"/>
        </div>
      </div>

      <p style={{fontSize: '16px', fontWeight: 'bold', marginTop: '20px' }}>Billing Address: </p>
      <div style={{ padding: '0 60px' }}>
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

      <div style={{ display: 'flex', justifyContent: 'right' }}>
        <button onClick={updateBillingAddress} style={{ marginTop: '24px', width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '5px', padding: '10px'}}>Continue</button>
      </div>

      {(savedBillingAddress && savedBillingAddress.postalCode) && <>
        <p style={{fontSize: '16px', fontWeight: 'bold', marginTop: '20px'}}>Payment: </p>
          { paymentForm }
        </>
      }

      {/* <div style={{ margin: '0 30px' }}>
        <button disabled={!enabledNextStep} style={{ opacity: enabledNextStep ? '1' : '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>PLACE YOUR ORDER</button>
      </div> */}
    </div>
  </section>
}

export default CheckoutPayment;