import { AddressRequestBody, Consignment, Country, Customer, CustomerAddress, Region } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { useCheckout } from "../CheckoutContext";

interface AddressOptionProps {
  updatedShippingAddress: AddressRequestBody | null;
  onInputChange: (updated: AddressRequestBody ) => void;
  selectedConsignment: Consignment | null;
}

const AddressOption = ({ updatedShippingAddress, onInputChange, selectedConsignment }: AddressOptionProps) => {

  const [isNewAddress, setIsNewAddress] = useState(false);
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [shippingAddress, setShippingAddress] = useState(updatedShippingAddress);

  const { state: checkoutState } = useCheckout();
  const customer = checkoutState.data.getCustomer();
  const countries = checkoutState.data.getShippingCountries() ?? [];
  const customerAddresses = customer?.addresses ?? [];

  useEffect(() => {
    if (selectedConsignment) {
      setShippingAddress(selectedConsignment.address);
    }
  }, [selectedConsignment])

  useEffect(() => {
    console.log('AddressOption shippingAddress: ');
    console.log(shippingAddress);

    console.log(shippingAddress?.countryCode);

    if (shippingAddress?.countryCode) {
      const selectedCountry = countries.find(c => c.code == shippingAddress.countryCode);
      if (selectedCountry?.subdivisions) {
        setProvinces(selectedCountry.subdivisions);
      }
    }
  }, [shippingAddress]);

  const handleChange = (e: any) => {
    console.log('e.target.value: '+e.target.value);
    setIsNewAddress(e.target.value == '1');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    console.log({ [e.target.name]: e.target.value })

    const updatedShippingAddress = {
      ...shippingAddress,
      [e.target.name]: e.target.value,
    } as AddressRequestBody;

    onInputChange(updatedShippingAddress);
    setShippingAddress(updatedShippingAddress);

    if (e.target.name == 'countryCode') {
      const selectedCountry = countries.find(c => c.code == e.target.value);
      if (selectedCountry?.subdivisions) {
        setProvinces(selectedCountry.subdivisions);
      }
    }
  };

  function isSameAddress(a: AddressRequestBody, b: AddressRequestBody): boolean {
    debugger;
    if (!a || !b) return false;

    const normalize = (val?: string) => (val || '').trim().toLowerCase();

    return (
      normalize(a.address1) === normalize(b.address1) &&
      normalize(a.city) === normalize(b.city) &&
      normalize(a.postalCode) === normalize(b.postalCode) &&
      normalize(a.countryCode) === normalize(b.countryCode) &&
      normalize(a.stateOrProvinceCode) === normalize(b.stateOrProvinceCode)
    );
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onInputChange(customerAddresses.find(a => a.id == (e.target.value as unknown as number)) as AddressRequestBody);
  }

  return <div>
    {(customer && customer.id) ? <>
      <div className="step-title">
        <input onChange={handleChange} value={0} name="address_option_saved" id="choose_saved_address" type="radio" ></input>        
        <label style={{ marginLeft: '10px' }} htmlFor="choose_saved_address">2. Choose a saved address:</label>
      </div>
      <div>
        <select onChange={handleAddressChange} style={{ borderRadius: '6px', marginTop: '10px', padding: '10px', width: '500px' }}>
          {customerAddresses.map((a) => <option selected={!!shippingAddress && isSameAddress(shippingAddress, a)} value={a.id} key={a.id}>{a.address1 + ' ' + a.company + ' '+a.city}</option>)}
        </select>
      </div>

      <div className="step-title" style={{ marginTop: '20px' }}>
        <input onChange={handleChange} value={1} name="address_option_saved" id="choose_new_address" type="radio" ></input>
        <label style={{ marginLeft: '10px', color: '#315B42' }} htmlFor="choose_new_address">Enter a new adddress:</label>
      </div>
      </>
      :
      <div className="step-title">
        <label>2. Shipping Address 1111</label>
      </div>
    }

      {(!customer || customer.isGuest || isNewAddress) && <div>
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