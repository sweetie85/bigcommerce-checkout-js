import { Consignment, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react"
import { useCheckout } from "../context/CheckoutContext";
import { GiftProduct } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";


interface GiftMessageOptionProps {
  showNumbering?: boolean;
  giftProducts: GiftProduct[];
  setGiftProductId: (id: string) => void;
  setGiftMessage: (message: string) => void;
  giftMessageLength: number;
  selectedConsignment: Consignment | null;
  checkoutId: string;
  setIsInProgress: (inProgress: boolean) => void;
  saveChanges: (moveNextStep: boolean) => void
}

const GiftMessageOptionEdit = ({ checkoutId, saveChanges, setIsInProgress, showNumbering = true, giftProducts, selectedConsignment, setGiftProductId, setGiftMessage, giftMessageLength }: GiftMessageOptionProps) => {

  const [isEnabled, setIsEnabled] = useState(true);
  const [hasMultipleGiftMessage, setHasMultipleGiftMessage] = useState(false);
  const [allowedCharLenth, setAllowedCharLenth] = useState(250);
  const [giftItem, setGiftItem] = useState<PhysicalItem | null>(null);
  const [isShowDeleteConfirmation, setIsShowDeleteConfirmation] = useState(false);
  const { checkoutState, checkoutService } = useCheckout();
  const [ giftMessageEdited, setGiftMessageEdited ] = useState('');
  
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
      saveChanges(false);
    });
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
