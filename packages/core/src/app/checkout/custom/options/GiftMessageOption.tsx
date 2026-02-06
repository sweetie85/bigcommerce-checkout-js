import { Consignment } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react"
import { useCheckout } from "../context/CheckoutContext";

interface GIftProduct {
  bigcommerce_product_id: string, 
  frontend_title: string 
}

interface GiftMessageOptionProps {
  giftProducts: GIftProduct[];
  setGiftProductId: (id: string) => void;
  setGiftMessage: (message: string) => void;
  selectedConsignment: Consignment | null;
}

const GiftMessageOption = ({ giftProducts, selectedConsignment, setGiftProductId, setGiftMessage }: GiftMessageOptionProps) => {

  const [isEnabled, setIsEnabled] = useState(false);
  const [hasMultipleGiftMessage, setHasMultipleGiftMessage] = useState(false);

  const { checkoutState } = useCheckout();
  
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

  return <div className="add-gift-single-popup-wrapper">
    <div className="step-title">
      <input onChange={(e) => setIsEnabled(!isEnabled)} name="address_option_saved" id="choose_gift_item" type="radio" value={1} ></input>
      <label htmlFor="choose_gift_item" style={{ marginLeft: '10px' }}>5. Add gift message::</label>
    </div>

    {isEnabled && <>
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
      <p style={{ marginLeft: '20px', marginTop: '5px', color: '#ccc'}}>150 characters remaining of 150</p>
    </>
    }
  </div>
  
}

export default GiftMessageOption;
