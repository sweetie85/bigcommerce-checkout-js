import React from "react";

const ConsignmentOption = () => {
  return <div>
    <p className="step-title">1. Choose delivery and gift message options:</p>
    <div>
      <input name="address_option" id="ship_to_single" type="radio" ></input>
      <label style={{ marginLeft: '10px' }} htmlFor="ship_to_single">Ship to a single address</label>
    </div>
    <div>
      <input name="address_option" id="ship_to_multiple" type="radio" ></input>
      <label style={{ marginLeft: '10px' }} htmlFor="ship_to_multiple">Ship to multiple addresses</label>
    </div>
  </div>
}

export default ConsignmentOption;