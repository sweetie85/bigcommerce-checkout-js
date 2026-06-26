import { AddressRequestBody, Consignment, ConsignmentAssignmentRequestBody, ConsignmentLineItem, Country, Customer, CustomerAddress, Region } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { useCheckout } from "../context/CheckoutContext";
import FutureShipDateOptionGroup from "./FutureShipDateOptionGroup";
import ShippingMethodOption from "./ShippingMethodOption";
import FutureShipDateOption from "./FutureShipDateOption";
import GiftMessageOption from "./GiftMessageOption";
import { CustomAddressRequestBody, CustomItem, GiftProduct } from "../types";
import { addItemsToCart, handleCheckoutError, validateAddress } from "../utility";

interface AddressOptionProps {
  checkoutId: string;
  giftProducts: GiftProduct[];
  selectedLineItems: CustomItem[];
  setIsInProgress: (inProgress: boolean) => void;
  onComplete: () => void;
}

const AddressOptionGroup = ({
  checkoutId,
  giftProducts,
  selectedLineItems,
  setIsInProgress,
  onComplete
}: AddressOptionProps) => {

  const [isNewAddress, setIsNewAddress] = useState(false);
  const [provinces, setProvinces] = useState<Region[]>([]);

  const [isUpdateAddressChecked, setIsUpdateAddressChecked] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<CustomAddressRequestBody | null>(null);
  const [shippingAddressError, setShippingAddressError] = useState<string | null>(null);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [futureShipDate, setFutureShipDate] = useState<string | null>(null);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shippingMethodErrorMessage, setShippingMethodErrorMessage] = useState<string | null>(null);
  
  // Custom message
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);

  const { checkoutState, checkoutService, storeConfig } = useCheckout();
  const customer = checkoutState.data.getCustomer();
  const countries = checkoutState.data.getShippingCountries() ?? [];
  const customerAddresses = customer?.addresses ?? [];

  const { futureShipDateFieldId: FUTURE_SHIP_DATE_FIELD_ID } = storeConfig;

  // useEffect(() => {
  //   if (selectedConsignment) {
  //     setShippingAddress(selectedConsignment.address);
  //   }
  // }, [selectedConsignment])

  useEffect(() => {
    // console.log('AddressOption shippingAddress: ');
    // console.log(shippingAddress);

    // console.log(shippingAddress?.countryCode);

    const selectedCountry = countries.find(c => c.code == 'US');
    if (selectedCountry?.subdivisions) {
      setProvinces(selectedCountry.subdivisions);
    }
  }, [countries]);

  const handleChange = (e: any) => {
    // console.log('e.target.value: '+e.target.value);
    setIsNewAddress(e.target.value == '1');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    // console.log({ [e.target.name]: e.target.value })

    const updatedShippingAddress = {
      ...shippingAddress,
      [e.target.name]: e.target.value,
    } as AddressRequestBody;

    updatedShippingAddress.countryCode = 'US';

    if (e.target.name == 'stateOrProvinceCode') {
      const province = provinces.find(p => p.code == e.target.value);
      if (province) {
        updatedShippingAddress.stateOrProvince = province.name;
      }
    }

    // onInputChange(updatedShippingAddress);
    setShippingAddress(updatedShippingAddress);

    // if (e.target.name == 'countryCode') {
    //   const selectedCountry = countries.find(c => c.code == e.target.value);
    //   if (selectedCountry?.subdivisions) {
    //     setProvinces(selectedCountry.subdivisions);
    //   }
    // }
  };

  function isSameAddress(a: AddressRequestBody, b: AddressRequestBody): boolean {
    // debugger;
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
    // onInputChange(customerAddresses.find(a => a.id == (e.target.value as unknown as number)) as AddressRequestBody);
    setShippingAddress(customerAddresses.find(a => a.id == (e.target.value as unknown as number)) as AddressRequestBody);
  }

  const handleAddressChangeOption = () => {

    const shouldShowAddressUpdate = !isUpdateAddressChecked;

    setIsUpdateAddressChecked(shouldShowAddressUpdate);

    if (!shouldShowAddressUpdate) {
      setShippingAddress(null);
    } else {

      if (selectedConsignment) {
        setShippingAddress(selectedConsignment.address);
      }
    }

    setFutureShipDate(null);
  }

  const validateAndSave = () => {
    saveChanges();
  }

  const saveChanges = async () => {
    setIsInProgress(true);

    // Mark this as multiple-consignment is manually assigned
    window.sessionStorage.setItem('CCC-PARAM--consignment-is-assigned-manually', '1');
    
    const giftItem = await addItemsToCart(checkoutId, gitProductId, giftMessage);
    await updateConsignments(giftItem);
    setIsInProgress(false);
  }

  const updateConsignments = async (giftItem: ConsignmentLineItem | null) => {
  
    const cart = checkoutState.data.getCart();

    if (!shippingAddress) {
      setErrorMessage('Please enter shipping address!');
      return null;
    }

    if (cart && shippingAddress) {
      // Check if all items are assigned to single address
      // const cartItems = cart.lineItems.physicalItems.filter(i => !i.parentId);
      // if (selecedItemIds.length == cartItems.length) {
      //   setIsShowSingleAddressConfirmation(true);
      //   return;
      // }

      if (!shippingAddress.countryCode) {
        shippingAddress.countryCode = 'US';
      }

      // Validate address
      if (!validateAddress(shippingAddress, setErrorMessage)) {
        return null;
      } else {
        setErrorMessage(null);
      }

      if (selectedConsignment && !selectedShippingOptionId) {
        setShippingMethodErrorMessage('Please select future ship date!');
        return null;
      } else {
        setShippingMethodErrorMessage(null);
      }

      const lineItems = selectedLineItems.map(i => {
        return { itemId: i.item.id, quantity: 1 };
      }) as ConsignmentLineItem[];

      if (giftItem) {
        lineItems.push(giftItem);
      }

      const updatedAddress = shippingAddress;
      if (!updatedAddress) {
        setShippingAddressError('Please select shipping address!');
        return null;
      }

      if (updatedAddress && futureShipDate) {

        const futureDateCustomData = {
          fieldId: FUTURE_SHIP_DATE_FIELD_ID,
          fieldValue: futureShipDate,
        };

        if (updatedAddress.customFields) {
          updatedAddress.customFields.push(futureDateCustomData);
        } else {
          updatedAddress.customFields = [futureDateCustomData];
        }
      }

      // debugger;

      const requestBody = {
        address: updatedAddress,
        shippingAddress: updatedAddress,
        lineItems: lineItems,
      } as ConsignmentAssignmentRequestBody;

      try {
        const res = await checkoutService.assignItemsToAddress(requestBody);

        const updatedConsignments = res.data.getConsignments();
        const lastConsignment = updatedConsignments ? updatedConsignments[updatedConsignments.length - 1] : null;
        setSelectedConsignment(lastConsignment);

        if (selectedShippingOptionId && lastConsignment) {
          await checkoutService.selectConsignmentShippingOption(lastConsignment.id, selectedShippingOptionId);
        }

      } catch(e: unknown) {
        const messages = handleCheckoutError(e);
        // messages.forEach(msg => alert(msg));
        if (messages.length > 0) {
          setErrorMessage(messages[0]);
          return null;
        }
      }

      // reset shipping details form once saved
      setFutureShipDate(null);
      setIsUpdateAddressChecked(false);
      setShippingAddress(null);
      setSelectedConsignment(null);
      setSelectedShippingOptionId(null);
      setShippingAddressError(null);

      onComplete();
    }
  }

  return <div className="ml-5">
    <div className="step-title address-update-arrow-wrapper" onClick={() => handleAddressChangeOption()}>
      {/* <input id="is_shipping_address_update" type="checkbox" checked={isUpdateAddressChecked} onChange={handleAddressChangeOption}></input>         */}
      <label className="is-shipping-address-update" htmlFor="is_shipping_address_update">Add delivery address</label>
      <svg width="9" height="14" viewBox="0 0 9 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.14483 0L9 6.97857L2.14483 14L0 11.7841L4.70206 7.02143L0 2.21585L2.14483 0Z" fill="#315B42"/>
      </svg>

    </div>

    {isUpdateAddressChecked &&
    <div className="address-card-wrapper">

      <div className="address-card__close-icon" onClick={() => setIsUpdateAddressChecked(false)}>
        <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14.5" cy="14.5" r="14" fill="#D9D9D9" stroke="#D9D9D9"/>
          <path d="M12.7715 9.785L15.2615 13.55H14.7515L17.2265 9.785H19.8665L16.1765 15.185L16.0865 14.48L19.8965 20H17.1965L14.5865 16.1H15.3215L12.7415 20H10.0415L13.8065 14.48L13.8215 15.185L10.1465 9.785H12.7715Z" fill="#315B42"/>
        </svg>
      </div>

      {(customer && !customer.isGuest) && <>
        <div className="step-title step-title-radio flex-align-center">
          <input checked={!isNewAddress} onChange={handleChange} value={0} name="address_option_saved" id="choose_saved_address" type="radio" ></input>        
          <label className={!isNewAddress ? 'selected' : ''} htmlFor="choose_saved_address" >Choose a saved address:</label>
        </div>
        <div>
          <select onChange={handleAddressChange} className="input-select">
            <option value={0}>Select a address</option>
            {customerAddresses.map((a) => <option selected={!!shippingAddress && isSameAddress(shippingAddress, a)} value={a.id} key={a.id}>{a.address1 + ' ' + a.company + ' '+a.city}</option>)}
          </select>
        </div>
      
        <div className="step-title step-title-radio flex-align-center mt-10">
          <input onChange={handleChange} value={1} name="address_option_saved" id="choose_new_address" type="radio" ></input>
          <label className={isNewAddress ? 'selected' : ''} htmlFor="choose_new_address">Enter a new adddress:</label>
        </div>
      </>}

      <div className="text-red-500 mb-5">{errorMessage}</div>
      
      {(!customer || customer.isGuest || isNewAddress) && <div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="*First Name" name="firstName" value={shippingAddress?.firstName} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="*Last Name" name="lastName" value={shippingAddress?.lastName} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="Email Address" name="email" value={shippingAddress?.email} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="Phone Number" name="phone" value={shippingAddress?.phone} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="Company Name" name="company" value={shippingAddress?.company} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="*Address" name="address1" value={shippingAddress?.address1} onChange={handleInputChange} />
        </div>
        <div className="form-field-row">
          <input className="custom-form-input text" type="text" placeholder="Address/Suite/Building" name="address2" value={shippingAddress?.address2} onChange={handleInputChange} />
          <input className="custom-form-input text" type="text" placeholder="*City" name="city" value={shippingAddress?.city} onChange={handleInputChange} />
          {/* <input className="custom-form-input text" type="text" placeholder="Country" name="countryCode" value={shippingAddress?.countryCode} onChange={handleInputChange} /> */}
          {/* <select className="custom-form-input select" name="countryCode" value={shippingAddress?.countryCode} onChange={handleInputChange}>
            <option value="">-- *Select a Country --</option>
            {countries.filter(c => c.code == 'US').map(c => <option value={c.code}>{c.name}</option>)}
          </select> */}
        </div>
        <div className="form-field-row">
          {/* {provinces.length == 0 ?
            <input className="custom-form-input text" type="text" placeholder="*State/Province" name="stateOrProvince" value={shippingAddress?.stateOrProvince} onChange={handleInputChange} />
          : 
            <select className="custom-form-input select" name="stateOrProvince" value={shippingAddress?.stateOrProvince} onChange={handleInputChange}>
              <option value="">-- *Select a State --</option>
              {provinces.map(c => <option value={c.code}>{c.name}</option>)}
            </select>
          } */}
          <select className="custom-form-input select" name="stateOrProvinceCode" value={shippingAddress?.stateOrProvinceCode} onChange={handleInputChange}>
            <option value="">-- *Select a State --</option>
            {provinces.map(c => <option value={c.code}>{c.name}</option>)}
          </select>
          <input className="custom-form-input text" type="text" placeholder="*Postal Code" name="postalCode" value={shippingAddress?.postalCode} onChange={handleInputChange} />
        </div>
      </div>}

      {/* { !selectedConsignment ?
        <div className="mt-8">
          <button onClick={() => validateAndSave()} className="w-50 text-center bg-[#315B42] text-white rounded-lg p-2.5">CONTINUE</button>
        </div>
      : */}
      <div className="mt-8">
        <div className="shipping-options-wrapper flex max-md:flex-col gap-5">
          <div className="shipping-options md:w-[48%]">
            <ShippingMethodOption 
              handleChange={(id) => { 
                setSelectedShippingOptionId(id);
                setShippingMethodErrorMessage(null);
              }}
              updatedShippingOptionId={selectedShippingOptionId} 
              selectedConsignment={null}
              showNumbering={false}
              />
            {shippingMethodErrorMessage && <div className="text-red-500 mb-5 mt-2">{shippingMethodErrorMessage}</div> }
          </div>
          <div className="future-ship-date-option md:w-[48%]">
            <FutureShipDateOption 
              handleChangeDate={setFutureShipDate}
              selectedConsignment={selectedConsignment}
              futureShipDateError={''}
              setShouldSelectShipDate={() => {}}
              showNumbering={false}
              />
          </div>
        </div>

        <div className="mt-8">
          <GiftMessageOption 
            giftProducts={giftProducts} 
            setGiftProductId={setGiftProductId} 
            setGiftMessage={setGiftMessage} 
            giftMessageLength={giftMessage ? giftMessage.length : 0}
            selectedConsignment={selectedConsignment}
            showNumbering={false}
            />
        </div>

        {shippingAddressError && <p className="text-red-500 font-bold">{shippingAddressError}</p>}
        <div className="mt-5">
          <button className="save-changes-button" onClick={() => validateAndSave()}>SAVE CHANGES</button>
        </div>
      </div>
      {/* } */}
    </div>
    }
 </div>
}

export default AddressOptionGroup;