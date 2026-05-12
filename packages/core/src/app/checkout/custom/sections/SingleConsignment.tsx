import React, { useEffect, useState } from "react";

import AddressOption from "../options/AddressOption";
import FutureShipDateOption from "../options/FutureShipDateOption";
import ShippingMethodOption from "../options/ShippingMethodOption";
import GiftMessageOption from "../options/GiftMessageOption";
import { AddressRequestBody, Consignment, ConsignmentAssignmentRequestBody, ConsignmentLineItem, PhysicalItem } from "@bigcommerce/checkout-sdk";
import { useCheckout } from "../context/CheckoutContext";
import { GiftProduct } from "../types";
import { addItemsToCart, handleCheckoutError, validateAddress } from "../utility";

interface SingleConsignmentProps {
  checkoutId: string;
  giftProducts: GiftProduct[];
  setIsInProgress: (inProgress: boolean) => void;
  gotoNextStep: () => void;
  // setEnabledNextStep: (e: boolean) => void;
}

const SingleConsignment = ({ checkoutId, giftProducts, setIsInProgress, gotoNextStep }: SingleConsignmentProps) => {

  const [isUpdateAddressChecked, setIsUpdateAddressChecked] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<AddressRequestBody | null>(null);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [enabledNextStep, setEnabledNextStep] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shipping options
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);

  // Custom message
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);

  // Future ship date
  const [shouldSelectShipDate, setShouldSelectShipDate] = useState(false);
  const [futureShipDate, setFutureShipDate] = useState<string | null>(null);
  const [futureShipDateError, setFutureShipDateError] = useState<string | null>(null);

  const { checkoutState, checkoutService, storeConfig } = useCheckout();
  const customer = checkoutState.data.getCustomer();
  const customerShippingAddress = checkoutState.data.getShippingAddress();
  const shippingOptions = checkoutState.data.getShippingOptions() ?? [];

  const { futureShipDateFieldId: FUTURE_SHIP_DATE_FIELD_ID } = storeConfig;
  
  useEffect(() => {
    if (customerShippingAddress) {
      if (customerShippingAddress.firstName !== 'TO_BE_ASSIGNED') {
        setShippingAddress(customerShippingAddress);
      } else {
        console.log('setShippingAddress');
        setShippingAddress(null);
      }

      console.log('customerShippingAddress: ');
      console.log(customerShippingAddress);
    }
      
  
    const selectedShippingOption = checkoutState.data.getSelectedShippingOption();
    if (selectedShippingOption) {
      setSelectedShippingOptionId(selectedShippingOption.id)
    }
  
    const consignments = checkoutState.data.getConsignments();
    // console.log('consignments: ');
    // console.log(consignments);
  
    if (consignments) {
      if (consignments.length == 1) {
        // Select default first consignment
        setSelectedConsignment(consignments[0]);
      } else if (consignments.length > 1) {
        setShippingAddress(null);
      }
    }
  }, []);

  useEffect(() => {
    if (customerShippingAddress) {
      const futureShipDateField = customerShippingAddress.customFields.find(c => c.fieldId == FUTURE_SHIP_DATE_FIELD_ID);
      
      if (futureShipDateField) {
        setFutureShipDate(futureShipDateField.fieldValue as string)
      } else {
        setFutureShipDate(null);
      }
    }
  }, [customerShippingAddress]);

  const handleAddressChange = (updatedAddress: AddressRequestBody) => {
    // console.log('setShippingAddress 2: ');
    setShippingAddress(updatedAddress); // ✅ Update single source of truth
  };

  const updateConsignments = async (giftItem: ConsignmentLineItem | null) : Promise<Consignment | null> => {
  
    const cart = checkoutState.data.getCart();

    if (!shippingAddress) {
      setErrorMessage('Please enter shipping address!');
      return null;
    }

    if (cart) {

      if (!shippingAddress.countryCode) {
        shippingAddress.countryCode = 'US';
      }

      // Validate address
      if (!validateAddress(shippingAddress, setErrorMessage)) {
        return null;
      } else {
        setErrorMessage(null);
      }

      const lineItems = cart.lineItems.physicalItems.filter(i => !i.parentId)
        .map(i => ({itemId: i.id, quantity: i.quantity})) as ConsignmentLineItem[];

      // console.log('Gift Item:');
      // console.log(giftItem);

      if (giftItem) {
        lineItems.push(giftItem);
      }

      const updatedAddress = shippingAddress;
      if (updatedAddress) {
        const futureDateCustomData = {
          fieldId: FUTURE_SHIP_DATE_FIELD_ID,
          fieldValue: futureShipDate ? futureShipDate : '',
        };

        if (updatedAddress.customFields) {
          updatedAddress.customFields.push(futureDateCustomData);
        } else {
          updatedAddress.customFields = [futureDateCustomData];
        }
      }

      const requestBody = {
          address: updatedAddress,
          shippingAddress: updatedAddress,
          lineItems: lineItems,
        } as ConsignmentAssignmentRequestBody;

      try {

        const res = await checkoutService.assignItemsToAddress(requestBody);
        const updatedConsignments = res.data.getConsignments();

        // Reset future ship date after saving
        // setFutureShipDate(null);
        setIsUpdateAddressChecked(false);

        return updatedConsignments ? updatedConsignments[0] : null;
      } catch (error) {
        const messages = handleCheckoutError(error);
        // messages.forEach(msg => alert(msg));
        if (messages.length > 0) {
          setErrorMessage(messages[0]);
          return null;
        }
      }
    }

    return null;
  }

  const isGiftItem = (item: PhysicalItem) => {
    return !!giftProducts.find(p => p.product_sku == item.sku);
  }

  function getTomorrowDate() {
    const date = new Date();
    date.setDate(date.getDate() + 1);

    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();

    return `${mm}/${dd}/${yyyy}`;
  }

  const saveChanges = async (moveNextStep = true, removeFufureShipDate = false) => {

    if (shouldSelectShipDate && !futureShipDate) {
      setFutureShipDateError('Please select future ship date!');
      return;
    } else {
      setFutureShipDateError(null);
    }

    setIsInProgress(true);

    // Check if Switching from multiple consignmet to single consignment
    const cart = checkoutState.data.getCart();
    const consignments = checkoutState.data.getConsignments();

    if (cart && consignments && consignments.length > 1) {
      // Delete gift products if any for multiple consignmet
      const giftItems = cart.lineItems.physicalItems.filter(i => !i.parentId && isGiftItem(i))
      // Delete gift items
      for(let i = 0; i < giftItems.length; i++) {

        await fetch(`/api/storefront/carts/${checkoutId}/items/${giftItems[i].id}`, {
          method: 'DELETE',
          credentials: 'same-origin'
        });
      }
    }

    // console.log('saveChanges: ');
    const giftItem = await addItemsToCart(checkoutId, gitProductId, giftMessage);

    const selectedConsignment = await updateConsignments(giftItem);

    // debugger;

    // console.log('Saving future save date: ');
    // NO more using this, using custom field instead
    // checkoutService.updateCheckout({ customerMessage: futureShipDate ? futureShipDate : getTomorrowDate() });
    
    if (selectedShippingOptionId) {
      if (selectedConsignment) {
        checkoutService.selectConsignmentShippingOption(selectedConsignment.id, selectedShippingOptionId);
      } else {
        checkoutService.selectShippingOption(selectedShippingOptionId);
      }
    }

    setIsInProgress(false);

    if (selectedShippingOptionId) {
      setEnabledNextStep(true);
    }

    if (selectedConsignment && moveNextStep) {
      gotoNextStep();
    }
  }

  useEffect(() => {
    if (shippingOptions.length > 0 && selectedShippingOptionId) {
      setEnabledNextStep(true);
    } else {
      setEnabledNextStep(false);
    }
  }, [shippingOptions, selectedShippingOptionId]);

  const shouldShowContinueButton = () => {
    return (!customer || customer.isGuest) && (!customerShippingAddress?.postalCode || customerShippingAddress.firstName == 'TO_BE_ASSIGNED');
  }

  return <>
  <div className="single-consignment-wrapper">
    <AddressOption 
      isUpdateAddressChecked={isUpdateAddressChecked}
      setIsUpdateAddressChecked={setIsUpdateAddressChecked}
      updatedShippingAddress={shippingAddress} 
      onInputChange={handleAddressChange}
      selectedConsignment={selectedConsignment}
      errorMessage={errorMessage}
    />

    {shouldShowContinueButton() ?
      <div style={{ marginTop: '30px' }}>
        <button onClick={() => saveChanges(false)} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>CONTINUE</button>
      </div>
    :
    <>
    {shippingOptions.length == 0 && <div style={{ marginTop: '30px' }}>
      <button onClick={() => saveChanges(false)} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>Save Changes</button>
    </div>
    }
    <hr style={{ margin: '30px 0'}} />

    <div className="shipping-options-wrapper">
      <div className="shipping-options">
        <ShippingMethodOption 
          handleChange={(id) => {
            // console.log('ShippingMethodOption id: '+id);
            setSelectedShippingOptionId(id);
          }} 
          updatedShippingOptionId={selectedShippingOptionId} 
          selectedConsignment={selectedConsignment}/>
      </div>
      <div className="future-ship-date-option">
        <FutureShipDateOption 
          // futureShipDate={futureShipDate} 
          handleChangeDate={setFutureShipDate}
          selectedConsignment={selectedConsignment}
          futureShipDateError={futureShipDateError}
          setShouldSelectShipDate={setShouldSelectShipDate}
          // saveChanges={saveChanges}
          />
      </div>
    </div>

    <hr style={{ margin: '30px 0'}} />      
    <GiftMessageOption 
      giftProducts={giftProducts} 
      setGiftProductId={setGiftProductId} 
      setGiftMessage={setGiftMessage} 
      giftMessageLength={giftMessage ? giftMessage.length : 0}
      selectedConsignment={selectedConsignment}
      />

    {/* <div style={{ textAlign: 'right', marginTop: '20px' }}>
      <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>SAVE CHANGES</button>
    </div> */}
    </>}
  </div>
  <div style={{ textAlign: 'right', margin: '20px 0' }}>
    {/* <button onClick={saveChanges}  style={{ backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button> */}
    <button onClick={() => saveChanges(true)} disabled={!enabledNextStep} style={{ opacity: enabledNextStep ? '1' : '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
  </div>
</>
}

export default SingleConsignment;