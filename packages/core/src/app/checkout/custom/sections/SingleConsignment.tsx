import React, { useEffect, useState } from "react";

import AddressOption from "../options/AddressOption";
import FutureShipDateOption from "../options/FutureShipDateOption";
import ShippingMethodOption from "../options/ShippingMethodOption";
import GiftMessageOption from "../options/GiftMessageOption";
import { AddressRequestBody, Consignment, ConsignmentAssignmentRequestBody, ConsignmentLineItem, PhysicalItem } from "@bigcommerce/checkout-sdk";
import { useCheckout } from "../context/CheckoutContext";

interface SingleConsignmentProps {
  checkoutId: string;
  giftProducts: { bigcommerce_product_id: string, frontend_title: string }[];
  setIsInProgress: (inProgress: boolean) => void;
  gotoNextStep: () => void;
  setEnabledNextStep: (e: boolean) => void;
}

const SingleConsignment = ({ checkoutId, giftProducts, setIsInProgress, setEnabledNextStep }: SingleConsignmentProps) => {

  const [isUpdateAddressChecked, setIsUpdateAddressChecked] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<AddressRequestBody | null>(null);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);

  // Shipping options
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);

  // Custom message
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);

  // Future ship date
  const [futureShipDate, setFutureShipDate] = useState<string | null>(null);

  const { checkoutState, checkoutService, hasShippingAddressEnabled, hasShippingMethodEnabled } = useCheckout();
  const customer = checkoutState.data.getCustomer();


  useEffect(() => {
    const customerShippingAddress = checkoutState.data.getShippingAddress();
    if (customerShippingAddress) {
      // console.log('isSingleAddress setShippingAddress 1: ');
      setShippingAddress(customerShippingAddress);
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

  const handleAddressChange = (updatedAddress: AddressRequestBody) => {
    // console.log('setShippingAddress 2: ');
    setShippingAddress(updatedAddress); // ✅ Update single source of truth
  };

  const updateConsignments = async (giftItem: ConsignmentLineItem | null) : Promise<Consignment | null> => {
  
    const cart = checkoutState.data.getCart();

    if (!shippingAddress) {
      // console.log('Please select shippingAddress');
      return null;
    }

    if (cart) {
      const lineItems = cart.lineItems.physicalItems.filter(i => !i.parentId)
        .map(i => ({itemId: i.id, quantity: i.quantity})) as ConsignmentLineItem[];

      // console.log('Gift Item:');
      // console.log(giftItem);

      if (giftItem) {
        lineItems.push(giftItem);
      }

      const updatedAddress = shippingAddress;
      if (updatedAddress && futureShipDate && updatedAddress.customFields) {
        updatedAddress.customFields.push({
          fieldId: 'field_26',
          fieldValue: futureShipDate,
        });
      }

      // console.log('updatedAddress:');
      // console.log(updatedAddress);

      const requestBody = {
          address: updatedAddress,
          shippingAddress: updatedAddress,
          lineItems: lineItems,
        } as ConsignmentAssignmentRequestBody;

      const res = await checkoutService.assignItemsToAddress(requestBody);
      const updatedConsignments = res.data.getConsignments();

      // Reset future ship date after saving
      setFutureShipDate(null);
      setIsUpdateAddressChecked(false);

      return updatedConsignments ? updatedConsignments[0] : null;
    }

    return null;
  }

  const addItemsToCart = async (gitProductId: string | null, giftMessage: string | null) => {
  
    // console.log('addItemsToCart: ');

    if (!gitProductId || !giftMessage) {
      return null;
    }

    const [productId, optionId] = gitProductId.split('|');

    const lineItems = [];
    const lineItem = {
      quantity: 1,
      productId: parseInt(productId),
      optionSelections: [{
        optionId: parseInt(optionId),
        optionValue: giftMessage
      }],
    };

    lineItems.push(lineItem);

    // console.log('lineItems: ');
    // console.log(lineItems);

    const endpoint = `/api/storefront/cart/${checkoutId}/items`;

    const payload = { lineItems };

    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Add item error:', error);
      alert('Error adding add-ons: ' + (error.title || 'Unknown error'));
      return null;
    } else {

      // console.log('Item added successfully.');
      // window.location.reload();
      // console.log(res);
      const response = await res.json();
      const physicalItems = response.lineItems.physicalItems as PhysicalItem[];
      
      const cartItems = physicalItems.filter(c => !c.parentId);;
      const lastItem = cartItems[cartItems.length - 1];

      return { itemId: lastItem.id, quantity: lastItem.quantity };
    }
  }

  const saveChanges = async () => {
    setIsInProgress(true);

    // console.log('saveChanges: ');
    const giftItem = await addItemsToCart(gitProductId, giftMessage);

    const selectedConsignment = await updateConsignments(giftItem);

    if (futureShipDate) {
      // console.log('Saving future save date: ');
      checkoutService.updateCheckout({ customerMessage: futureShipDate });
    }
    
    if (selectedShippingOptionId) {
      if (selectedConsignment) {
        checkoutService.selectConsignmentShippingOption(selectedConsignment.id, selectedShippingOptionId);
      } else {
        checkoutService.selectShippingOption(selectedShippingOptionId);
      }
    }

    setEnabledNextStep(true);

    setIsInProgress(false);
  }

  return <div className="single-consignment-wrapper">
    <AddressOption 
      isUpdateAddressChecked={isUpdateAddressChecked}
      setIsUpdateAddressChecked={setIsUpdateAddressChecked}
      updatedShippingAddress={shippingAddress} 
      onInputChange={handleAddressChange}
      selectedConsignment={selectedConsignment}
    />

    {(!customer || customer.isGuest) &&
      <div style={{ marginTop: '30px' }}>
        <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>CONTINUE</button>
      </div>
    }

    {hasShippingMethodEnabled && <>
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
          futureShipDate={futureShipDate} 
          handleChangeDate={setFutureShipDate}
          selectedConsignment={selectedConsignment}
          />
      </div>
    </div>

    <hr style={{ margin: '30px 0'}} />      
    <GiftMessageOption 
      giftProducts={giftProducts} 
      setGiftProductId={setGiftProductId} 
      setGiftMessage={setGiftMessage} 
      selectedConsignment={selectedConsignment}
      />

    <div style={{ textAlign: 'right', marginTop: '20px' }}>
      <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>SAVE CHANGES</button>
    </div>
    </>}
  </div>
}

export default SingleConsignment;