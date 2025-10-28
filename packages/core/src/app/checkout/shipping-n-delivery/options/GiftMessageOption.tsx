import React, { useEffect, useState } from "react"

interface GIftProduct {
  bigcommerce_product_id: string, 
  frontend_title: string 
}

interface GiftMessageOptionProps {
  giftProducts: GIftProduct[];
  handleAddItemsToCart: (gitProductId: string | null, giftMessage: string | null) => {}
}

const GiftMessageOption = ({ giftProducts, handleAddItemsToCart }: GiftMessageOptionProps) => {
  
  // Custom message
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);

  return <div>
    <div className="step-title">
      <input name="address_option_saved" id="choose_gift_item" type="radio" ></input>
      <label htmlFor="choose_gift_item" style={{ marginLeft: '10px' }}>5. Add gift message::</label>
    </div>

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
    {/* <button onClick={() => handleAddItemsToCart(gitProductId, giftMessage)}>Add</button> */}

    <div style={{ textAlign: 'right', marginTop: '20px' }}>
      <button onClick={() => handleAddItemsToCart(gitProductId, giftMessage)} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>SAVE CHANGES</button>
    </div>
  </div>
}

export default GiftMessageOption;
