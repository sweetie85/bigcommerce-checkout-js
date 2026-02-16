import { Consignment, ConsignmentAssignmentRequestBody, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useRef, useState } from "react"
import { useCheckout } from "../context/CheckoutContext";
import { useOutsideClick } from "../hools/useOutsideClick";
import { CustomItem } from "../types";
import { GiftProduct } from "../types";

interface GiftMessageOptionProps {
  giftItem: CustomItem;
  giftProducts: GiftProduct[];
  selectedConsignment: Consignment | null;
  checkoutId: string;
  setIsInProgress: (inProgress: boolean) => void;
  giftItemError: string | null;
}

const GiftMessageOptionGroupEdit = ({ checkoutId, giftItem, giftProducts, selectedConsignment, setIsInProgress, giftItemError }: GiftMessageOptionProps) => {

  const [isEnabled, setIsEnabled] = useState(false);
  const [hasMultipleGiftMessage, setHasMultipleGiftMessage] = useState(false);

  // Custom message
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);

  const popupRef = useRef<HTMLDivElement | null>(null);

  const { checkoutState, checkoutService } = useCheckout();
  
  useOutsideClick(popupRef, () => { setIsEnabled(false) }, isEnabled);

  useEffect(() => {
    if (selectedConsignment) {

      // selectedConsignment.lineItemIds

      const cart = checkoutState.data.getCart();
      if (cart) {
        const selectedConsignmentItems = cart.lineItems.physicalItems.filter(i => !i.parentId && selectedConsignment.lineItemIds.includes(i.id as string));
        // console.log(selectedConsignmentItems);

        const giftItems = selectedConsignmentItems.filter(i => i.sku.startsWith('CARD-'));

        if (giftItems.length >= 1) {
          // console.log('setHasMultipleGiftMessage true');
          setHasMultipleGiftMessage(true);
        } else {
          // console.log('setHasMultipleGiftMessage false');
          setHasMultipleGiftMessage(false);
        }
      }

      if (giftItem && giftItem.item.options)  {
        const giftMessage = giftItem.item.options[0].value ?? null;
        setGiftMessage(giftMessage);

        const giftProduct = giftProducts.find(p => p.product_sku == giftItem.item.sku);

        if (giftProduct) {
          setGiftProductId(giftProduct.bigcommerce_product_id);
        }
      }
      
    } else {
      setHasMultipleGiftMessage(false);
      // console.log('setHasMultipleGiftMessage false');
    }

  }, [giftItem, selectedConsignment]);

  const updateItemToCart = async (itemId: string) => {

    setIsInProgress(true);

    // Delete the item first
    fetch(`/api/storefront/carts/${checkoutId}/items/${itemId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    })
    .then(res => res.json())
    .then(data => {

      // Add mew gift item
      addItemToCart();
    });
  }

  const addItemToCart = async () => {

    if (!gitProductId || !giftMessage) {
      setIsInProgress(false);
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

      // console.log('Item added successfully.');
      // window.location.reload();
      // console.log(res);

      const response = await res.json();
      const physicalItems = response.lineItems.physicalItems as PhysicalItem[];

      // Collect only main products
      const cartItems = physicalItems.filter(i => !i.parentId);
      const lastItem = cartItems[cartItems.length - 1];

      const giftItem = { itemId: lastItem.id, quantity: 1 };

      if (selectedConsignment) {
        // selectedConsignment.lineItemIds.push(giftItem);

        // Capture selected shipping option
        const shippingOptionId = selectedConsignment.selectedShippingOption?.id;

        const requestBody = {
          address: selectedConsignment.address,
          shippingAddress: selectedConsignment.address,
          lineItems: [giftItem],
        } as ConsignmentAssignmentRequestBody;

        // console.log('assignItemsToAddress: ');
        // console.log(requestBody);

        await checkoutService.assignItemsToAddress(requestBody);

        // Setting back shipping methods again
        if (shippingOptionId) {
          await checkoutService.selectConsignmentShippingOption(selectedConsignment.id, shippingOptionId);
        }

        setIsEnabled(false);
      }
    }

    setIsInProgress(false);
  }

  const getGiftItemName = () => {
    const giftProduct = giftProducts.find(p => p.product_sku == giftItem.item.sku);
    return giftProduct?.frontend_title;
  }

  return <div style={{ position: 'relative', width: '100%' }}>
    <div style={{ position: 'relative', display: 'flex', gap: '20px' }}>
      <button className="button-add-gift-message">{ getGiftItemName() }</button>
      {/* <svg style={{ position: 'absolute', right: '10px', top: '16px' }} width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2.14483L7.02143 9L-9.37535e-08 2.14483L2.21585 -5.15101e-07L6.97857 4.70206L11.7841 -9.6858e-08L14 2.14483Z" fill="#315B42"/>
      </svg> */}
      <button onClick={() => setIsEnabled(!isEnabled)} style={{ width: '150px', textAlign: 'center', backgroundColor: 'rgb(49, 91, 66)', color: '#fff', borderRadius: '10px', padding: '10px' }}>View Details</button>
    </div>


    {isEnabled && <div ref={popupRef} className="add-gift-popup-wrapper">
    {/* { hasMultipleGiftMessage && <p style={{ color: 'red' }}>NOTE: You may only apply one gift message to each consignment.</p> } */}
    { giftItemError && <p style={{ color: 'red' }}>Error: {giftItemError}</p> }
    <div>
      <select onChange={(e) => setGiftProductId(e.target.value) }>
        { giftProducts.map((p) => 
          <option selected={giftItem.item.sku == p.product_sku} key={p.bigcommerce_product_id} value={p.bigcommerce_product_id}>{p.frontend_title}</option>
        ) }
      </select>
      </div>

      <div>
        <textarea onChange={(e) => setGiftMessage(e.target.value)} placeholder="Type your message here">{giftMessage}</textarea>
      </div>
      {/* <p style={{ marginLeft: '20px', marginTop: '5px', color: '#ccc'}}>150 characters remaining of 150</p> */}

      <div className="save-button-wrapper">
        <button className="save-button" onClick={() => updateItemToCart(giftItem.item.id as string)}>Update</button>
      </div>
    </div>
    }
  </div>
  
}

export default GiftMessageOptionGroupEdit;
