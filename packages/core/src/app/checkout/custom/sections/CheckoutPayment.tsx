import { AddressRequestBody, CheckoutStoreSelector, Region } from "@bigcommerce/checkout-sdk";
import React, { ReactNode, useEffect, useState } from "react";
import { useCheckout } from "../context/CheckoutContext";
import PaymentOptionsImage from "../../../../static/payment-gateways.png"
import FullPageLoader from "../FullPageLoader";
import { validateAddress } from "../utility";

interface CheckoutPaymentProps {
  checkoutId: string;
  paymentForm: ReactNode;
}

const CheckoutPayment = ({ checkoutId, paymentForm } :CheckoutPaymentProps) => {

  const [billingAddress, setBillingAddress] = useState<AddressRequestBody | null>(null);
  const [isInProgress, setIsInProgress] = useState(false);
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { checkoutService, checkoutState } = useCheckout();
  const savedBillingAddress = checkoutState.data.getBillingAddress();
  const consignments = checkoutState.data.getConsignments() || [];

  const countries = checkoutState.data.getShippingCountries() ?? [];

  useEffect(() => {
    if (savedBillingAddress) {
      setTimeout(() => {
        setBillingAddress(savedBillingAddress);

        const checkout = checkoutService.getState().data.getCheckout();
        if (checkout) {
          console.log('Billing Consignments:', checkout.consignments)
          console.log('Billing Address:', checkout.billingAddress);
          console.log('Customer Info:', checkout.customer);
        }

      }, 2000); // Let's billing address saved completely
    } else {
      setBillingAddress(null);
    }
  }, [savedBillingAddress]);

  useEffect(() => {
      // console.log('AddressOption shippingAddress: ');
      // console.log(shippingAddress);
  
      // console.log(shippingAddress?.countryCode);
  
      if (billingAddress?.countryCode) {
        const selectedCountry = countries.find(c => c.code == billingAddress.countryCode);
        if (selectedCountry?.subdivisions) {
          setProvinces(selectedCountry.subdivisions);
        }
      }
    }, [billingAddress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
      setBillingAddress({
        ...billingAddress,
        [e.target.name]: e.target.value,
      } as AddressRequestBody);
    };

  const updateBillingAddress = async () => {
    if (billingAddress) {

      // Validate address
      if (!validateAddress(billingAddress, setErrorMessage)) {
        return null;
      } else {
        setErrorMessage(null);
      }
      setIsInProgress(true);
      
      await checkoutService.updateBillingAddress(billingAddress);
      
      console.log('Billing address updated.');
      console.log('Reloading checkout');

      window.location.href = window.location.origin+window.location.pathname+'?tab=payment';

      // checkoutService.loadCheckout(checkoutId);

      /*
      // Re-assign shipping options
      for (let i = 0; i < consignments.length; i++) {
        console.log('Re assigning consignments: '+i);

        const thisConsignment = consignments[0];

        console.log('thisConsignment.selectedShippingOption: ');
        console.log(thisConsignment.selectedShippingOption);

        if (thisConsignment.selectedShippingOption) {
          await checkoutService.selectConsignmentShippingOption(thisConsignment.id, thisConsignment.selectedShippingOption.id);
        }
      }
      
      setIsInProgress(false);
      */

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

      <p style={{fontSize: '16px', fontWeight: 'bold', marginTop: '20px' }}>Billing Address: <span style={{ color: 'red' }}>{errorMessage}</span></p>
      <div style={{ padding: '0 60px' }}>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="*First Name" name="firstName" value={billingAddress?.firstName} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="*Last Name" name="lastName" value={billingAddress?.lastName} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="Company Name" name="company" value={billingAddress?.company} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Phone Number" name="phone" value={billingAddress?.phone} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="*Address" name="address1" value={billingAddress?.address1} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Address/Suite/Building" name="address2" value={billingAddress?.address2} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="*City" name="city" value={billingAddress?.city} onChange={handleInputChange} />
          {/* <input className="custom-form-input text" type="text" placeholder="Country" name="countryCode" value={shippingAddress?.countryCode} onChange={handleInputChange} /> */}
          <select className="custom-form-input select" name="countryCode" value={billingAddress?.countryCode} onChange={handleInputChange}>
            <option value="">-- *Select a Country --</option>
            {countries.filter(c => c.code == 'US').map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-field-row">
          {provinces.length == 0 ?
            <input className="custom-form-input text" type="text" placeholder="*State/Province" name="stateOrProvince" value={billingAddress?.stateOrProvince} onChange={handleInputChange} />
          : 
            <select className="custom-form-input select" name="stateOrProvince" value={billingAddress?.stateOrProvince} onChange={handleInputChange}>
              <option value="">-- *Select a State --</option>
              {provinces.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          }
          <input className="custom-form-input text" type="text" placeholder="*Postal Code" name="postalCode" value={billingAddress?.postalCode} onChange={handleInputChange} />
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