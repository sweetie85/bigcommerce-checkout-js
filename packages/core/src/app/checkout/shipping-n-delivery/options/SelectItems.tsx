import { Cart } from "@bigcommerce/checkout-sdk";
import React from "react";

interface SelectItemsProps {
  cart: Cart | undefined;
  selecedItemIds: string[];
  onChangeSelectedItems: (ids: string[]) => void
}

const SelectItems = ({ cart, selecedItemIds, onChangeSelectedItems }: SelectItemsProps) => {

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
      { cart ?
        (cart.lineItems.physicalItems.map(i => <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '20px'}}>
          <input type="checkbox" value={i.id} checked={selecedItemIds.includes(i.id as string)} onChange={handleChange} />
          <div style={{ display: 'flex', backgroundColor: '#fff', padding: '10px', borderRadius: '20px', width: "100%" }}>
            <div style={{ width: '20%' }}><img style={{ maxWidth: '100px', maxHeight: '200px' }} src={i.imageUrl} /></div>
            <div style={{ width: '60%', fontWeight: 'bold' }}>
              <div className="product-title">{i.quantity} x {i.name}</div>
              {i.options?.map(o => <div key={o.nameId} className="product-option">{o.name} {o.value}</div>)}
            </div>
            <div style={{ width: '20%', fontWeight: 'bold' }} className="product-price">${i.salePrice}</div>
            <div style={{ width: '40%', fontWeight: 'bold' }} className="">Ship to:</div>
          </div>
          </div>))
        : <></>
      }
    </div>
  </div>
}

export default SelectItems;