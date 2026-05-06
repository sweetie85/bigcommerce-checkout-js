import { Consignment, ConsignmentAssignmentRequestBody, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useRef, useState } from "react"
import { useCheckout } from "../context/CheckoutContext";
import { useOutsideClick } from "../hools/useOutsideClick";
import { GiftProduct } from "../types";


interface GiftMessageOptionProps {
  giftProducts: GiftProduct[];
  // setGiftProductId: (id: string) => void;
  // setGiftMessage: (message: string) => void;
  selectedConsignment: Consignment | null;
  checkoutId: string;
  setIsInProgress: (inProgress: boolean) => void;
  giftItemError: string | null;
}

const GiftMessageOptionGroup = ({ checkoutId, giftProducts, selectedConsignment, setIsInProgress, giftItemError }: GiftMessageOptionProps) => {

  const [isEnabled, setIsEnabled] = useState(false);
  const [hasMultipleGiftMessage, setHasMultipleGiftMessage] = useState(false);
  const [allowedCharLenth, setAllowedCharLenth] = useState(250);
  
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
    } else {
      setHasMultipleGiftMessage(false);
      // console.log('setHasMultipleGiftMessage false');
    }

  }, [selectedConsignment]);

  const addItemToCart = async () => {

    // console.log('addItemsToCart: ');

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

  const remainingCharacters = () => {
    if (!giftMessage) {
      return allowedCharLenth;
    }

    const giftMessageLength = giftMessage.length;
    return allowedCharLenth >= giftMessageLength ? allowedCharLenth - giftMessageLength : 0;
  }

  return <div className="relative w-full">
    <div className="relative">
      <button className="button-add-gift-message" onClick={() => setIsEnabled(!isEnabled)}>Add Gift Message</button>
      <svg className="absolute right-2.5 top-4" width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2.14483L7.02143 9L-9.37535e-08 2.14483L2.21585 -5.15101e-07L6.97857 4.70206L11.7841 -9.6858e-08L14 2.14483Z" fill="#315B42"/>
      </svg>
    </div>


    {isEnabled && <div ref={popupRef} className="add-gift-popup-wrapper">
    { hasMultipleGiftMessage && <p className="text-red-500">NOTE: You may only apply one gift message to each consignment.</p> }
    { giftItemError && <p className="text-red-500">Error: {giftItemError}</p> }
    <div>
      <select onChange={(e) => { 
        setGiftProductId(e.target.value) 
        const selectedProduct = giftProducts.find(p => p.bigcommerce_product_id == e.target.value);
        setAllowedCharLenth(selectedProduct ? parseInt(selectedProduct.message_characters_limit.toString()) : 250);
      }}>
        <option value="">None</option>
        { giftProducts.map((p) => <option key={p.bigcommerce_product_id} value={p.bigcommerce_product_id}>{p.frontend_title}</option>) }
      </select>
      </div>

      <div>
        <textarea maxLength={allowedCharLenth} onChange={(e) => remainingCharacters() >= 0 ? setGiftMessage(e.target.value) : null} placeholder="Type your message here"></textarea>
      </div>
      <p className="mt-1 text-[#ccc]">{remainingCharacters()} characters remaining of {allowedCharLenth}</p>

      <div className="save-button-wrapper">
        <button className="save-button" onClick={addItemToCart}>Save Changes</button>
      </div>
    </div>
    }
  </div>
  
}

export default GiftMessageOptionGroup;
