import { Consignment, ConsignmentAssignmentRequestBody, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react"
import { useCheckout } from "../context/CheckoutContext";
import { GiftProduct } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";


interface GiftMessageOptionProps {
  showNumbering?: boolean;
  giftProducts: GiftProduct[];
  giftMessageLength: number;
  selectedConsignment: Consignment | null;
  checkoutId: string;
  setIsInProgress: (inProgress: boolean) => void;
  saveChanges: (moveNextStep: boolean) => void
  selectedShippingOptionId: null | string;
}

const GiftMessageOptionEdit = ({ checkoutId, selectedShippingOptionId, saveChanges, setIsInProgress, showNumbering = true, giftProducts, selectedConsignment, giftMessageLength }: GiftMessageOptionProps) => {

  const [isEnabled, setIsEnabled] = useState(true);
  const [hasMultipleGiftMessage, setHasMultipleGiftMessage] = useState(false);
  const [allowedCharLenth, setAllowedCharLenth] = useState(250);
  const [giftItem, setGiftItem] = useState<PhysicalItem | null>(null);
  const [isShowDeleteConfirmation, setIsShowDeleteConfirmation] = useState(false);
  const { checkoutState, checkoutService } = useCheckout();
  const [ giftMessageEdited, setGiftMessageEdited ] = useState('');

  // Custom message
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);
  
  const customer = checkoutState.data.getCustomer();
  const stepNumber = customer?.isGuest ? 6 : 5;
  

  useEffect(() => {
    if (selectedConsignment) {

      // selectedConsignment.lineItemIds

      const cart = checkoutState.data.getCart();
      if (cart) {
        const selectedConsignmentItems = cart.lineItems.physicalItems.filter(i => selectedConsignment.lineItemIds.includes(i.id as string));
        // console.log(selectedConsignmentItems);

        const giftItems = selectedConsignmentItems.filter(i => i.sku.startsWith('CARD-'));

        if (giftItems.length >= 1) {
          // console.log('setHasMultipleGiftMessage true');
          setHasMultipleGiftMessage(true);
          setGiftItem(giftItems[0]);

          const giftItem = giftItems[0];

          if (giftItem && giftItem.options) {
            setGiftMessageEdited(giftItem.options[0].value);

            const giftProductVariantId = giftItem.productId + '|' + giftItem.options[0].nameId;

            setGiftProductId(giftProductVariantId);
            setGiftMessage(giftItem.options[0].value);
          }
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

  const deleteItem = async (itemId: string) => {
  
    setIsShowDeleteConfirmation(false);
    setIsInProgress(true);

    // Delete the item first
    await fetch(`/api/storefront/carts/${checkoutId}/items/${itemId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    })

    if (selectedShippingOptionId) {
      await checkoutService.selectShippingOption(selectedShippingOptionId);
    }
    
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
    .then(async data => {
      await addItemToCart();
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
  
          // Force SDK to refresh its internal state
          await checkoutService.loadCheckout(checkoutId);

          setIsEnabled(false);
          setIsInProgress(true);
        }
      }
  
      setIsInProgress(false);
    }


  const remainingCharacters = () => {
    return allowedCharLenth >= giftMessageLength ? allowedCharLenth - giftMessageLength : 0;
  }

  return <div className="add-gift-single-popup-wrapper">
    <div className="step-title">
      <input onChange={(e) => setIsEnabled(!isEnabled)} checked={isEnabled} name="address_option_saved" id="choose_gift_item" type="radio" value={1} ></input>
      <label htmlFor="choose_gift_item" className="ml-2.5">{showNumbering && <span>{stepNumber}. </span>} Add Gift Message: (If this is a gift, be sure to include so your recipient knows who sent the gift. Billing name will not appear on packing slip.)</label>
    </div>

    {isEnabled && <>
    {/* { hasMultipleGiftMessage && <p>NOTE: You may only apply one gift message to each consignment.</p> } */}
    <div>
      <select className="max-md:w-11/12! md:w-125 rounded-md mt-2.5 p-2.5" onChange={(e) => {
        setGiftProductId(e.target.value);
        const selectedProduct = giftProducts.find(p => p.bigcommerce_product_id == e.target.value);
        setAllowedCharLenth(selectedProduct ? parseInt(selectedProduct.message_characters_limit.toString()) : 250);
      }}>
        <option value="">None</option>
        { giftProducts.map((p) => <option selected={!!giftItem && giftItem.sku == p.product_sku} key={p.bigcommerce_product_id} value={p.bigcommerce_product_id}>{p.frontend_title}</option>) }
      </select>
      </div>

      <div>
        <textarea maxLength={allowedCharLenth} className="p-2 h-25 max-md:w-11/12! md:w-125 rounded-md mt-2.5" onChange={(e) => {
          if (remainingCharacters() >= 0) { 
            setGiftMessage(e.target.value);
            setGiftMessageEdited(e.target.value);
          }
        }} 
          placeholder="Type your message here"
          value={giftMessageEdited}>
        </textarea>
      </div>
      <p className="ml-5 mt-1 text-[#ccc]">{remainingCharacters()} characters remaining of {allowedCharLenth}</p>
    </>
    }

    <div className="save-button-wrapper ml-4">
      <button onClick={() => { setIsShowDeleteConfirmation(true) }} className="mr-5">Remove</button>
      <button className="save-button" onClick={() => {
        if (giftItem) {
          updateItemToCart(giftItem.id as string)
        }
      }}>Update</button>
    </div>

    <ConfirmDialog 
      isOpen={isShowDeleteConfirmation} 
      message="Are you sure you want to remove the associated custom gift message?" 
      onConfirm={() => { 
        if(giftItem) {
          deleteItem(giftItem.id as string);
        }
      }}
      onCancel={() => setIsShowDeleteConfirmation(false)}
      />
  </div>
  
}

export default GiftMessageOptionEdit;
