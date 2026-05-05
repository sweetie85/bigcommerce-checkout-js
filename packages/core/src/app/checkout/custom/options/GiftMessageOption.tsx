import { Consignment } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react"
import { useCheckout } from "../context/CheckoutContext";
import { GiftProduct } from "../types";


interface GiftMessageOptionProps {
  showNumbering?: boolean;
  giftProducts: GiftProduct[];
  setGiftProductId: (id: string) => void;
  setGiftMessage: (message: string) => void;
  giftMessageLength: number;
  selectedConsignment: Consignment | null;
}

const GiftMessageOption = ({ showNumbering = true, giftProducts, selectedConsignment, setGiftProductId, setGiftMessage, giftMessageLength }: GiftMessageOptionProps) => {

  const [isEnabled, setIsEnabled] = useState(false);
  const [hasMultipleGiftMessage, setHasMultipleGiftMessage] = useState(false);
  const [allowedCharLenth, setAllowedCharLenth] = useState(250);
  const { checkoutState } = useCheckout();
  
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

  const remainingCharacters = () => {
    return allowedCharLenth >= giftMessageLength ? allowedCharLenth - giftMessageLength : 0;
  }

  return <div className="add-gift-single-popup-wrapper">
    <div className="step-title">
      <input onChange={(e) => setIsEnabled(!isEnabled)} name="address_option_saved" id="choose_gift_item" type="radio" value={1} ></input>
      <label htmlFor="choose_gift_item" style={{ marginLeft: '10px' }}>{showNumbering && <span>{stepNumber}. </span>} Add gift message::</label>
    </div>

    {isEnabled && <>
    { hasMultipleGiftMessage && <p style={{ color: 'red' }}>NOTE: You may only apply one gift message to each consignment.</p> }
    <div>
      <select className="max-md:w-11/12! md:w-125 rounded-md mt-2.5 p-2.5" onChange={(e) => {
        setGiftProductId(e.target.value);
        const selectedProduct = giftProducts.find(p => p.bigcommerce_product_id == e.target.value);
        setAllowedCharLenth(selectedProduct ? parseInt(selectedProduct.message_characters_limit.toString()) : 250);
      }}>
        <option value="">None</option>
        { giftProducts.map((p) => <option key={p.bigcommerce_product_id} value={p.bigcommerce_product_id}>{p.frontend_title}</option>) }
      </select>
      </div>

      <div>
        <textarea maxLength={allowedCharLenth} className="p-2 h-25 max-md:w-11/12! md:w-125 rounded-md mt-2.5" onChange={(e) => remainingCharacters() >= 0 ? setGiftMessage(e.target.value) : null } placeholder="Type your message here"></textarea>
      </div>
      <p style={{ marginLeft: '20px', marginTop: '5px', color: '#ccc'}}>{remainingCharacters()} characters remaining of {allowedCharLenth}</p>
    </>
    }
  </div>
  
}

export default GiftMessageOption;
