import { Consignment } from "@bigcommerce/checkout-sdk";
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
}

const GiftMessageOptionGroup = ({ giftProducts, selectedConsignment }: GiftMessageOptionProps) => {

  const [isEnabled, setIsEnabled] = useState(false);
  const [hasMultipleGiftMessage, setHasMultipleGiftMessage] = useState(false);

  // Custom message
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);

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

  return <div style={{ position: 'relative' }}>
    <div style={{ position: 'relative' }}>
      <button style={{ width: '300px', textAlign: 'left', padding: '10px', background: '#fff', fontSize: '14px' }} onClick={() => setIsEnabled(!isEnabled)}>Add Gift Message</button>
      <svg style={{ position: 'absolute', right: '10px', top: '16px' }} width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2.14483L7.02143 9L-9.37535e-08 2.14483L2.21585 -5.15101e-07L6.97857 4.70206L11.7841 -9.6858e-08L14 2.14483Z" fill="#315B42"/>
      </svg>
    </div>


    {isEnabled && <div style={{ position: 'absolute', zIndex: 99, background: '#fff', left: 0, top: '50px', padding: '20px' }}>
    { hasMultipleGiftMessage && <p style={{ color: 'red' }}>NOTE: You are supposed to add only one gift message per consignment</p> }
    <div>
      <select onChange={(e) => setGiftProductId(e.target.value) } style={{ borderRadius: '6px', marginTop: '10px', padding: '10px', width: '500px' }}>
        <option value="">Select Gift</option>
        { giftProducts.map((p) => <option key={p.bigcommerce_product_id} value={p.bigcommerce_product_id}>{p.frontend_title}</option>) }
      </select>
      </div>

      <div>
        <textarea onChange={(e) => setGiftMessage(e.target.value)} style={{ marginTop: '10px', width: '500px', height: '100px', borderRadius: '6px' }} placeholder="Type your message here"></textarea>
      </div>
      <p style={{ marginLeft: '20px', marginTop: '5px', color: '#ccc'}}>150 characters remaining of 150</p>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'right' }}>
        <button onClick={() => {}} style={{ backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>Save Changes</button>
      </div>
    </div>
    }
  </div>
  
}

export default GiftMessageOptionGroup;
