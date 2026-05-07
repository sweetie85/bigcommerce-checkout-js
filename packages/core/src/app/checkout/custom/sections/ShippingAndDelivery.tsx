import React, { useEffect, useState } from "react";

import { 
  BillingAddress,
  Consignment, 
  CustomerAddress,
} from '@bigcommerce/checkout-sdk';

import ConsignmentOption from "../options/ConsignmentOption";
import { useCheckout } from '../context/CheckoutContext';
import MultipleConsignments from "./MultipleConsignments";
import { trim } from "lodash";
import FullPageLoader from "../FullPageLoader";
import SingleConsignment from "./SingleConsignment";
import { GiftProduct } from "../types";


interface ShippingAndDeliveryProps {
  checkoutId: string;
  giftProducts: GiftProduct[];
  gotoNextStep: () => void
}

const ShippingAndDelivery = ({ checkoutId, giftProducts, gotoNextStep }: ShippingAndDeliveryProps) => {

  // consignment address 
  const [isSingleAddress, setIsSingleAddress] = useState(true);

  const [isSignInActice, setIsSigninActive] = useState<boolean>(false);
  const [guestEmalId, setGuestEmailId] = useState('');
  const [guestEmalError, setGuestEmalError] = useState<string | null>(null);
  const [showTopSteps, setShowTopSteps] = useState(true);

  // Address
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  
  const [isInProgress, setIsInProgress] = useState(false);


  // Next page
  const [enabledNextStep, setEnabledNextStep] = useState(false);
  // const checkoutContext = useContext(CheckoutContext);
  const { checkoutState, checkoutService } = useCheckout();
  const customer = checkoutState.data.getCustomer();
  const billingAddress = checkoutState.data.getBillingAddress();

  useEffect(() => {
    // Load Customer address
    if (customer) {
      setCustomerAddresses(customer.addresses);
    }

    // Guest email id is saving as billing address email id so use billing email as guest email
    setGuestEmailId(billingAddress && billingAddress.email ? billingAddress.email : '');

    const consignments = checkoutState.data.getConsignments();
    // console.log('consignments: ');
    // console.log(consignments);
  
    if (consignments) {
      if (consignments.length > 1) {
        setIsSingleAddress(false);
        setEnabledNextStep(true);
      }
    }

    console.log('Cart Data: ');
    console.log(checkoutState.data.getCart());

    console.log('Consignment Data: ');
    console.log(checkoutState.data.getConsignments());
  }, []);

  const saveGuestEmail = async () => {

    const emailRegex = /^([a-zA-Z0-9_.\-])+@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    if (trim(guestEmalId).length == 0) {
      setGuestEmalError('Email address is required'); 
    } else if (!emailRegex.test(guestEmalId)) {
      setGuestEmalError('Email address is invalid'); 
    } else {
      setGuestEmalError(null);
    }

    setIsInProgress(true);

    // console.log('continueAsGuest: ');
    // checkoutService.continueAsGuest()
    const res = await checkoutService.continueAsGuest({
      email: guestEmalId,
    });
    
    setIsInProgress(false);

    // console.log(res);
  }

  

  const handleGuestEmailChange = (e: any) => {
    setGuestEmailId(e.target.value);

    const emailRegex = /^([a-zA-Z0-9_.\-])+@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

     if (trim(e.target.value).length == 0) {
      setGuestEmalError('Email address is required');
    } else {
      setGuestEmalError(null);
    }
  }

  return <div className="shipping-n-delivery">

    {isInProgress && <FullPageLoader /> }

    {((!customer || customer.isGuest) && showTopSteps) &&
      <div className="step-title choose-consignment-type">
        <label>1. Enter your email address:</label>
        <div className="form-field-row ml-8 gap-5 justify-start!">
          <input className="custom-form-input text" type="text" placeholder="Email Id" onChange={handleGuestEmailChange} value={guestEmalId} />
          <button className="button-continue" onClick={saveGuestEmail}>Continue</button>
        </div>
        
        { guestEmalError && <div><span className="text-error">{guestEmalError}</span></div>}
        
        {isSignInActice ? <>
          <div className="form-field-row">
            <input className="custom-form-input text" type="password" placeholder="Password" onChange={handleGuestEmailChange} />
          </div>
          <div className="mt-7">
            <button onClick={() => {}} className="w-50 text-center bg-[#315B42] text-white rounded p-2">Sign In</button>
            <button onClick={() => setIsSigninActive(false)} className="text-[#315B42] ml-2 w-50 text-center bg-white border border-[#ccc] rounded-sm p-2">Cancel</button>
          </div>
          </>
        : 
          <div className="ml-8 mt-5 mb-5">
            Already have an account? <a onClick={() => window.location.href = "/login.php"} className="cursor-pointer underline">Sign in now</a>
          </div>
        }
      </div>
    }

    {/* Important: Validating using billingAddress */}
    { (billingAddress && billingAddress.email) &&
      <div>
        <>
          {showTopSteps && 
            <ConsignmentOption
              isSingleAddress={isSingleAddress} 
              setIsSingleAddress={setIsSingleAddress} 
              stepNumber={!customer || customer.isGuest ? 2 : 1}
              />
          }

          {!isSingleAddress && <div>
            <MultipleConsignments 
              checkoutId={checkoutId}
              giftProducts={giftProducts}
              setIsInProgress={setIsInProgress}
              gotoNextStep={gotoNextStep}
              setIsSingleAddress={setIsSingleAddress}
              stepNumber={!customer || customer.isGuest ? 3 : 2}
              setShowTopSteps={setShowTopSteps}
            />
          </div>
          }
        </> 

        {isSingleAddress && <SingleConsignment 
          checkoutId={checkoutId} 
          giftProducts={giftProducts}
          setIsInProgress={setIsInProgress}
          gotoNextStep={gotoNextStep}
          // setEnabledNextStep={setEnabledNextStep}
          />}
      </div>
    }

  </div>
}

export default ShippingAndDelivery;