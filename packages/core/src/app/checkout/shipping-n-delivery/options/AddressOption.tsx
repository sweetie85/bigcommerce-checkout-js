import { CustomerAddress } from "@bigcommerce/checkout-sdk";
import React from "react";

interface AddressOptionProps {
  customerAddresses: CustomerAddress[];
}

const AddressOption = ({ customerAddresses }: AddressOptionProps) => {
  return <div>
    <div className="step-title">
        <input name="address_option_saved" id="choose_saved_address" type="radio" ></input>
        <label style={{ marginLeft: '10px' }} htmlFor="choose_saved_address">2. Choose a saved address:</label>
      </div>
      <div>
        <select style={{ borderRadius: '6px', marginTop: '10px', padding: '10px', width: '500px' }}>
          {customerAddresses.map((a) => <option key={a.id}>{a.address1 + ' '+a.city}</option>)}
        </select>
      </div>

      <div className="step-title" style={{ marginTop: '20px' }}>
        <input name="address_option_saved" id="choose_saved_address" type="radio" ></input>
        <label style={{ marginLeft: '10px', color: '#315B42', opacity: 0.5 }} htmlFor="choose_saved_address">Enter a new adddress:</label>
      </div>
 </div>
}

export default AddressOption;