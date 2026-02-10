import { Customer } from "@bigcommerce/checkout-sdk";
import React from "react";

interface ConsignmentOptionProps {
  isSingleAddress: boolean;
  setIsSingleAddress: (isSingle: boolean) => void;
}

const ConsignmentOption = ({ isSingleAddress, setIsSingleAddress }: ConsignmentOptionProps) => {

  const handleChange = (e: any) => {
    const isSingleAddress = e.target.value == 'SINGLE';
    if (!isSingleAddress) {
      window.sessionStorage.removeItem('CCC-PARAM--consignment-is-assigned-manually');
    }
    setIsSingleAddress(isSingleAddress);
  }

  return <div className="choose-consignment-type">
    <p className="step-title">1. Choose delivery and gift message options:</p>
    <div style={{ marginLeft: '16px' }}>
      <div className="step-title-radio flex-align-center">
        <input onChange={handleChange} checked={isSingleAddress} value={'SINGLE'} name="address_option" id="ship_to_single" type="radio" ></input>
        <label htmlFor="ship_to_single" className={isSingleAddress ? 'selected' : ''}>Ship to a <span className="highlight">single</span> address</label>
      </div>
      <div className="step-title-radio flex-align-center">
        <input onChange={handleChange} checked={!isSingleAddress} value={'MULTIPLE'} name="address_option" id="ship_to_multiple" type="radio" ></input>
        <label htmlFor="ship_to_multiple" className={!isSingleAddress ? 'selected' : ''}>Ship to <span className="highlight">multiple</span> addresses</label>
      </div>
    </div>
  </div>
}

export default ConsignmentOption;