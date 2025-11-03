import { Cart, Consignment } from "@bigcommerce/checkout-sdk";
import React from "react";
import { formatAddress } from "../../custom-utility";

interface SelectItemsProps {
  cart: Cart;
  consignments: Consignment[];
  selecedItemIds: string[];
  onChangeSelectedItems: (ids: string[]) => void
}

const SelectItems = ({ cart, consignments, selecedItemIds, onChangeSelectedItems }: SelectItemsProps) => {

  const handleChange = (e: any) => {

    const selectedId = e.target.value;
    const currentSelecedItemIds = [...selecedItemIds];

    if (currentSelecedItemIds.includes(selectedId)) {

      const index = currentSelecedItemIds.indexOf(selectedId);
      if (index > -1) { // Only splice if value is found
        currentSelecedItemIds.splice(index, 1);
      }

    } else {
      currentSelecedItemIds.push(selectedId);
    }

    console.log('currentSelecedItemIds: ');
    console.log(currentSelecedItemIds);

    onChangeSelectedItems(currentSelecedItemIds);
  }

  return <div style={{marginTop: '20px'}}>
      <p className="step-title">2. Select an item(s) to add a delivery address. Apply future ship date and an optional gift message for each destination.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>

      {/* Iterate through every consignmets and filter items */}
      { consignments.map(c => 
        (cart.lineItems.physicalItems
          .filter(i => c.lineItemIds.includes(i.id as string))
          .map(i => <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '20px'}}>
            <input type="checkbox" value={i.id} checked={selecedItemIds.includes(i.id as string)} onChange={handleChange} />
            <div style={{ display: 'flex', backgroundColor: '#fff', padding: '10px', borderRadius: '20px', width: "100%" }}>
              <div style={{ width: '20%' }}><img style={{ maxWidth: '100px', maxHeight: '200px' }} src={i.imageUrl} /></div>
              <div style={{ width: '60%', fontWeight: 'bold' }}>
                <div className="product-title">{i.quantity} x {i.name}</div>
                {i.options?.map(o => <div key={o.nameId} className="product-option">{o.name} {o.value}</div>)}
              </div>
              <div style={{ width: '20%', fontWeight: 'bold' }} className="product-price">${i.salePrice}</div>
              
              <div style={{ width: '40%', color: '#315B4287', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '16px' }}>Ship to: </div>
                <div style={{ width: '70%', textDecoration: 'underline' }}>{formatAddress(c.address)}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
}

export default SelectItems;