import { AddressRequestBody, Country, Customer, CustomerAddress, Region } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";

interface AddressOptionProps {
  countries: Country[],
  customer: Customer,
  customerAddresses: CustomerAddress[];
  shippingAddress: AddressRequestBody | null;
  onInputChange: (updated: AddressRequestBody ) => void;
}

const AddressOption = ({ countries, customer, customerAddresses, shippingAddress, onInputChange }: AddressOptionProps) => {

  const [isNewAddress, setIsNewAddress] = useState(false);
  const [provinces, setProvinces] = useState<Region[]>([]);

  useEffect(() => {
    console.log('shippingAddress: ');
    console.log(shippingAddress);

    console.log(shippingAddress?.countryCode);

    if (shippingAddress?.countryCode) {
      const selectedCountry = countries.find(c => c.code == shippingAddress.countryCode);
      if (selectedCountry?.subdivisions) {
        setProvinces(selectedCountry.subdivisions);
      }
    }
  }, []);

  const handleChange = (e: any) => {
    console.log('e.target.value: '+e.target.value);
    setIsNewAddress(e.target.value == '1');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    onInputChange({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    } as AddressRequestBody );

    if (e.target.name == 'countryCode') {
      const selectedCountry = countries.find(c => c.code == e.target.value);
      if (selectedCountry?.subdivisions) {
        setProvinces(selectedCountry.subdivisions);
      }
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onInputChange(customerAddresses.find(a => a.id == (e.target.value as unknown as number)) as AddressRequestBody);
  }

  return <div>
    {!!customer.id ? <>
      <div className="step-title">
        <input onChange={handleChange} value={0} name="address_option_saved" id="choose_saved_address" type="radio" ></input>        
        <label style={{ marginLeft: '10px' }} htmlFor="choose_saved_address">2. Choose a saved address:</label>
      </div>
      <div>
        <select onChange={handleAddressChange} style={{ borderRadius: '6px', marginTop: '10px', padding: '10px', width: '500px' }}>
          {customerAddresses.map((a) => <option value={a.id} key={a.id}>{a.address1 + ' '+a.city}</option>)}
        </select>
      </div>

      <div className="step-title" style={{ marginTop: '20px' }}>
        <input onChange={handleChange} value={1} name="address_option_saved" id="choose_new_address" type="radio" ></input>
        <label style={{ marginLeft: '10px', color: '#315B42' }} htmlFor="choose_new_address">Enter a new adddress:</label>
      </div>
      </>
      :
      <div className="step-title">
        <label>2. Shipping Address</label>
      </div>
    }

      {(!customer.id || isNewAddress) && <div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="First Name" name="firstName" value={shippingAddress?.firstName} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Last Name" name="lastName" value={shippingAddress?.lastName} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="Company Name" name="company" value={shippingAddress?.company} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Phone Number" name="phone" value={shippingAddress?.phone} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="Address" name="address1" value={shippingAddress?.address1} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Address/Suite/Building" name="address2" value={shippingAddress?.address2} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="City" name="city" value={shippingAddress?.city} onChange={handleInputChange} />
          {/* <input className="custom-form-input text" type="text" placeholder="Country" name="countryCode" value={shippingAddress?.countryCode} onChange={handleInputChange} /> */}
          <select className="custom-form-input select" name="countryCode" value={shippingAddress?.countryCode} onChange={handleInputChange}>
            <option value="">-- Select a Country --</option>
            {countries.map(c => <option value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-field-row">
          {provinces.length == 0 ?
            <input className="custom-form-input text" type="text" placeholder="State/Province" name="stateOrProvince" value={shippingAddress?.stateOrProvince} onChange={handleInputChange} />
          : 
            <select className="custom-form-input select" name="stateOrProvince" value={shippingAddress?.stateOrProvince} onChange={handleInputChange}>
              <option value="">-- Select a State --</option>
              {provinces.map(c => <option value={c.code}>{c.name}</option>)}
            </select>
          }
          <input className="custom-form-input text" type="text" placeholder="Postal Code" name="postalCode" value={shippingAddress?.postalCode} onChange={handleInputChange} />
        </div>
      </div>}
 </div>
}

export default AddressOption;