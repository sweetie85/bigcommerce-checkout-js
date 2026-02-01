import { Consignment, ConsignmentAssignmentRequestBody } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react"
import { useCheckout } from "../CheckoutContext";

interface GIftProduct {
  bigcommerce_product_id: string, 
  frontend_title: string 
}

interface GiftMessageOptionProps {
  giftProducts: GIftProduct[];
  // setGiftProductId: (id: string) => void;
  // setGiftMessage: (message: string) => void;
  selectedConsignment: Consignment | null;
  checkoutId: string;
  setIsInProgress: (inProgress: boolean) => void;
}

const GiftMessageOptionGroup = ({ checkoutId, giftProducts, selectedConsignment, setIsInProgress }: GiftMessageOptionProps) => {

  const [isEnabled, setIsEnabled] = useState(false);
  const [hasMultipleGiftMessage, setHasMultipleGiftMessage] = useState(false);

  // Custom message
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);

  const { checkoutState, checkoutService } = useCheckout();
  
  useEffect(() => {
    if (selectedConsignment) {

      // selectedConsignment.lineItemIds

      const cart = checkoutState.data.getCart();
      if (cart) {
        const selectedConsignmentItems = cart.lineItems.physicalItems.filter(i => selectedConsignment.lineItemIds.includes(i.id as string));
        console.log(selectedConsignmentItems);

        const giftItems = selectedConsignmentItems.filter(i => i.sku.startsWith('CARD-'));

        if (giftItems.length >= 1) {
          console.log('setHasMultipleGiftMessage true');
          setHasMultipleGiftMessage(true);
        } else {
          console.log('setHasMultipleGiftMessage false');
          setHasMultipleGiftMessage(false);
        }
      }
    } else {
      setHasMultipleGiftMessage(false);
      console.log('setHasMultipleGiftMessage false');
    }

  }, [selectedConsignment]);

  const addItemToCart = async () => {

    console.log('addItemsToCart: ');

    if (!gitProductId || !giftMessage) {
      return null;
    }

    setIsInProgress(true);

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

    const endpoint = checkoutId ? `/api/storefront/cart/${checkoutId}/items` : `/api/storefront/cart`;

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
      
      setIsInProgress(false);
      return null;
    } else {

      console.log('Item added successfully.');
      // window.location.reload();
      console.log(res);
      const response = await res.json();
      const cartItems = response.lineItems.physicalItems;
      const lastItem = cartItems[cartItems.length - 1];

      const giftItem = { itemId: lastItem.id, quantity: lastItem.quantity };

      if (selectedConsignment) {
        // selectedConsignment.lineItemIds.push(giftItem);

        const requestBody = {
          address: selectedConsignment.address,
          shippingAddress: selectedConsignment.address,
          lineItems: [giftItem],
        } as ConsignmentAssignmentRequestBody;

        await checkoutService.assignItemsToAddress(requestBody);

        setIsEnabled(false);
      }
    }

    setIsInProgress(false);
  }

  return <div style={{ position: 'relative' }}>
    <div style={{ position: 'relative' }}>
      <button className="button-add-gift-message" onClick={() => setIsEnabled(!isEnabled)}>Add Gift Message</button>
      <svg style={{ position: 'absolute', right: '10px', top: '16px' }} width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2.14483L7.02143 9L-9.37535e-08 2.14483L2.21585 -5.15101e-07L6.97857 4.70206L11.7841 -9.6858e-08L14 2.14483Z" fill="#315B42"/>
      </svg>
    </div>


    {isEnabled && <div className="add-gift-popup-wrapper">
    { hasMultipleGiftMessage && <p style={{ color: 'red' }}>NOTE: You are supposed to add only one gift message per consignment</p> }
    <div>
      <select onChange={(e) => setGiftProductId(e.target.value) }>
        <option value="">Select Gift</option>
        { giftProducts.map((p) => <option key={p.bigcommerce_product_id} value={p.bigcommerce_product_id}>{p.frontend_title}</option>) }
      </select>
      </div>

      <div>
        <textarea onChange={(e) => setGiftMessage(e.target.value)} placeholder="Type your message here"></textarea>
      </div>
      {/* <p style={{ marginLeft: '20px', marginTop: '5px', color: '#ccc'}}>150 characters remaining of 150</p> */}

      <div className="save-button-wrapper">
        <button className="save-button" onClick={addItemToCart}>Save Changes</button>
      </div>
    </div>
    }
  </div>
  
}

export default GiftMessageOptionGroup;
