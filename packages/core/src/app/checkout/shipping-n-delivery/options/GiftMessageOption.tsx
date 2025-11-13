import React, { useEffect, useState } from "react"

interface GIftProduct {
  bigcommerce_product_id: string, 
  frontend_title: string 
}

interface GiftMessageOptionProps {
  giftProducts: GIftProduct[];
  setGiftProductId: (id: string) => void;
  setGiftMessage: (message: string) => void;
}

const GiftMessageOption = ({ giftProducts, setGiftProductId, setGiftMessage }: GiftMessageOptionProps) => {

  const [isEnabled, setIsEnabled] = useState(false);

  return <div>
    <div className="step-title">
      <input onChange={(e) => setIsEnabled(!isEnabled)} name="address_option_saved" id="choose_gift_item" type="radio" value={1} ></input>
      <label htmlFor="choose_gift_item" style={{ marginLeft: '10px' }}>5. Add gift message::</label>
    </div>

    {isEnabled && <>
    <div>
      <select onChange={(e) => setGiftProductId(e.target.value) } style={{ borderRadius: '6px', marginLeft: '20px', marginTop: '10px', padding: '10px', width: '500px' }}>
        <option value="">Select Gift</option>
        { giftProducts.map((p) => <option key={p.bigcommerce_product_id} value={p.bigcommerce_product_id}>{p.frontend_title}</option>) }
      </select>
      </div>

      <div>
        <textarea onChange={(e) => setGiftMessage(e.target.value)} style={{ marginTop: '10px',  marginLeft: '20px', width: '500px', height: '100px', borderRadius: '6px' }} placeholder="Type your message here"></textarea>
      </div>
      <p style={{ marginLeft: '20px', marginTop: '5px', color: '#ccc'}}>150 characters remaining of 150</p>
    </>
    }
  </div>
  
}

export default GiftMessageOption;
