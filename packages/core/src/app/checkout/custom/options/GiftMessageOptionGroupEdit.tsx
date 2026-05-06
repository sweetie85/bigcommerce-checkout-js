import { Consignment, ConsignmentAssignmentRequestBody, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useRef, useState } from "react"
import { useCheckout } from "../context/CheckoutContext";
import { useOutsideClick } from "../hools/useOutsideClick";
import { CustomItem } from "../types";
import { GiftProduct } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";

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
  const [isShowDeleteConfirmation, setIsShowDeleteConfirmation] = useState(false);
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

  const deleteItem = async (itemId: string) => {

    setIsShowDeleteConfirmation(false);
    setIsInProgress(true);

    // Delete the item first
    await fetch(`/api/storefront/carts/${checkoutId}/items/${itemId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    })
   
    // Force SDK to refresh its internal state
    await checkoutService.loadCheckout(checkoutId);

    setIsInProgress(false);
  } 

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

  const remainingCharacters = () => {
    if (!giftMessage) {
      return allowedCharLenth;
    }

    const giftMessageLength = giftMessage.length;
    return allowedCharLenth >= giftMessageLength ? allowedCharLenth - giftMessageLength : 0;
  }

  return <div className="relative w-full">
    <div className="relative flex gap-5">
      <div className="button-add-gift-message flex justify-between items-center">
        <span>{ getGiftItemName() }</span>
        <svg onClick={() => { setIsShowDeleteConfirmation(true) }} className="cursor-pointer w-5.5 h-5.5" width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14.5" cy="14.5" r="14" fill="#D9D9D9" stroke="#315B42"></circle>
          <path d="M12.7715 9.785L15.2615 13.55H14.7515L17.2265 9.785H19.8665L16.1765 15.185L16.0865 14.48L19.8965 20H17.1965L14.5865 16.1H15.3215L12.7415 20H10.0415L13.8065 14.48L13.8215 15.185L10.1465 9.785H12.7715Z" fill="#315B42"></path>
        </svg>
      </div>
      {/* <svg width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2.14483L7.02143 9L-9.37535e-08 2.14483L2.21585 -5.15101e-07L6.97857 4.70206L11.7841 -9.6858e-08L14 2.14483Z" fill="#315B42"/>
      </svg> */}

      <button onClick={() => setIsEnabled(!isEnabled)} className="w-37.5 text-center text-white rounded-lg p-2.5 bg-[#315b42]">View Details</button>
    </div>


    {isEnabled && <div ref={popupRef} className="add-gift-popup-wrapper">
    {/* { hasMultipleGiftMessage && <p>NOTE: You may only apply one gift message to each consignment.</p> } */}
    { giftItemError && <p className="text-red-500">Error: {giftItemError}</p> }
    <div>
      <select onChange={(e) => {
        setGiftProductId(e.target.value); 
        const selectedProduct = giftProducts.find(p => p.bigcommerce_product_id == e.target.value);
        setAllowedCharLenth(selectedProduct ? parseInt(selectedProduct.message_characters_limit.toString()) : 250);
      }}>
        { giftProducts.map((p) => 
          <option selected={giftItem.item.sku == p.product_sku} key={p.bigcommerce_product_id} value={p.bigcommerce_product_id}>{p.frontend_title}</option>
        ) }
      </select>
      </div>

      <div>
        <textarea maxLength={allowedCharLenth} onChange={(e) => remainingCharacters() >= 0 ? setGiftMessage(e.target.value) : null} placeholder="Type your message here">{giftMessage}</textarea>
      </div>
      <p className="mt-1 text-[#ccc]">{remainingCharacters()} characters remaining of {allowedCharLenth}</p>

      <div className="save-button-wrapper">
        <button onClick={() => { setIsShowDeleteConfirmation(true) }} className="mr-5">Remove</button>
        <button className="save-button" onClick={() => updateItemToCart(giftItem.item.id as string)}>Update</button>
      </div>
    </div>
    }

    <ConfirmDialog 
      isOpen={isShowDeleteConfirmation} 
      message="Are you sure you want to remove the associated custom gift message?" 
      onConfirm={() => { 
        deleteItem(giftItem.item.id as string);
      }}
      onCancel={() => setIsShowDeleteConfirmation(false)}
      />
  </div>
  
}

export default GiftMessageOptionGroupEdit;
