import { Customer } from "@bigcommerce/checkout-sdk";
import React from "react";

interface ConsignmentOptionProps {
  customer: Customer;
  isSingleAddress: boolean;
  setIsSingleAddress: (isSingle: boolean) => void;
}

const ConsignmentOption = ({ customer, isSingleAddress, setIsSingleAddress }: ConsignmentOptionProps) => {

  const handleChange = (e: any) => {
    setIsSingleAddress(e.target.value == 'SINGLE');
  }

  return <div>
    <p className="step-title">1. Choose delivery and gift message options:</p>
    { !!customer.id && <>
      <div>
        <input onChange={handleChange} checked={isSingleAddress} value={'SINGLE'} name="address_option" id="ship_to_single" type="radio" ></input>
        <label style={{ marginLeft: '10px' }} htmlFor="ship_to_single">Ship to a single address</label>
      </div>
      <div>
        <input onChange={handleChange} checked={!isSingleAddress} value={'MULTIPLE'} name="address_option" id="ship_to_multiple" type="radio" ></input>
        <label style={{ marginLeft: '10px' }} htmlFor="ship_to_multiple">Ship to multiple addresses</label>
      </div>
    </>
    }
  </div>
}

export default ConsignmentOption;