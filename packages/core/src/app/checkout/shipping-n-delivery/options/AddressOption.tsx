import { CustomerAddress } from "@bigcommerce/checkout-sdk";
import React, { useState } from "react";

interface AddressOptionProps {
  customerAddresses: CustomerAddress[];
}

const AddressOption = ({ customerAddresses }: AddressOptionProps) => {

  const [isNewAddress, setIsNewAddress] = useState(false);

  const handleChange = (e: any) => {
    console.log('e.target.value: '+e.target.value);
    setIsNewAddress(e.target.value == '1');
  };

  return <div>
    <div className="step-title">
        <input onChange={handleChange} value={0} name="address_option_saved" id="choose_saved_address" type="radio" ></input>
        <label style={{ marginLeft: '10px' }} htmlFor="choose_saved_address">2. Choose a saved address:</label>
      </div>
      <div>
        <select style={{ borderRadius: '6px', marginTop: '10px', padding: '10px', width: '500px' }}>
          {customerAddresses.map((a) => <option key={a.id}>{a.address1 + ' '+a.city}</option>)}
        </select>
      </div>

      <div className="step-title" style={{ marginTop: '20px' }}>
        <input onChange={handleChange} value={1} name="address_option_saved" id="choose_new_address" type="radio" ></input>
        <label style={{ marginLeft: '10px', color: '#315B42' }} htmlFor="choose_new_address">Enter a new adddress:</label>
      </div>

      {isNewAddress && <div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="First Name" />
          <input className="custom-form-input text" type="text" placeholder="Last Name" />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="Company Name" />
          <input className="custom-form-input text" type="text" placeholder="Phone Number" />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="Address" />
          <input className="custom-form-input text" type="text" placeholder="Address/Suite/Building" />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="City" />
          <input className="custom-form-input text" type="text" placeholder="Country" />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="State/Province" />
          <input className="custom-form-input text" type="text" placeholder="Postal Code" />
        </div>
      </div>}
 </div>
}

export default AddressOption;