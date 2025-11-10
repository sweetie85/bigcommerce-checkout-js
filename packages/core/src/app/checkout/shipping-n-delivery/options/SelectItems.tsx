import { Cart, Consignment, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { formatAddress } from "../../custom-utility";

interface SelectItemsProps {
  cart: Cart;
  consignments: Consignment[];
  selecedItemIds: string[];
  onChangeSelectedItems: (ids: string[]) => void;
  onSelectConsignment: (id: string) => void;
}

const SelectItems = ({ cart, consignments, selecedItemIds, onChangeSelectedItems, onSelectConsignment }: SelectItemsProps) => {
  const [mainCartItems, setMainCartItems] = useState<PhysicalItem[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [showDetailsItemIds, setShowDetailsItemIds] = useState<number[]>([]);

  useEffect(() => {
    if (cart) {
      const mainItems = cart.lineItems.physicalItems.filter(c => !c.parentId);
      setMainCartItems(mainItems);
    }
  }, []);

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

  const toggleViewDetails = (id: number) => {
    const index = showDetailsItemIds.indexOf(id);
    const newShowDetailsItemIds = [...showDetailsItemIds];
    
    if (index === -1) {
      // number not exist → add it
      newShowDetailsItemIds.push(id);
    } else {
      // number exist → remove it
      newShowDetailsItemIds.splice(index, 1);
    }

    setShowDetailsItemIds(newShowDetailsItemIds);
  }

  return <div style={{marginTop: '20px'}}>
      <p className="step-title">2. Select an item(s) to add a delivery address. Apply future ship date and an optional gift message for each destination.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>

      {/* Iterate through every consignmets and filter items */}
      { consignments.map(c => <div style={{ border: '2px solid #315B42', borderRadius: '10px', margin: '0 10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {mainCartItems.filter(i => c.lineItemIds.includes(i.id as string))
          .map(i => <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '20px'}}>
            
            { isEdit &&
              <input type="checkbox" value={i.id} checked={selecedItemIds.includes(i.id as string)} onChange={handleChange} />
            }

            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '10px', borderRadius: '20px', width: "100%" }}>
              <div style={{ width: '20%' }}><img style={{ maxWidth: '100px', maxHeight: '200px' }} src={i.imageUrl} /></div>
              <div style={{ width: '60%', fontWeight: 'bold' }}>
                <div className="product-title">{i.quantity} x {i.name}</div>

                {(i.options && i.options.length > 0) ?
                  (showDetailsItemIds.includes(i.id as number) ?
                    <div>
                      {i.options?.map(o => <div key={o.nameId} style={{ fontWeight: '500' }} className="product-option">{o.name} {o.value}</div>)}
                      <div style={{ marginTop: '10px', cursor: 'pointer', color: '#315B42', opacity: 0.5, textDecoration: 'underline' }} onClick={() => toggleViewDetails(i.id as number)}>View Less</div>
                    </div>
                    : 
                    <div style={{ marginTop: '10px', cursor: 'pointer', color: '#315B42', opacity: 0.5, textDecoration: 'underline' }} onClick={() => toggleViewDetails(i.id as number)}>View Details</div>
                  )
                : <></>}
              </div>
              <div style={{ width: '15%', fontWeight: 'bold' }} className="product-price">
                <div>${i.salePrice}</div>
                <div>{c.selectedShippingOption?.description}</div>
              </div>
              
              <div style={{ width: '15%', marginRight: '20px' }}>
                <div onClick={() => { 
                  setIsEdit(!isEdit); 
                  onSelectConsignment(c.id);
                }} style={{ cursor: 'pointer', border: '1px solid #555', borderRadius: '8px', padding: '5px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <span style={{}}>Edit</span>
                  <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.1077 1.6839C11.327 1.91231 11.6176 2.16138 11.8125 2.40032C12.0261 2.66225 12.0667 2.94835 11.8862 3.24731C9.77644 5.44062 7.6541 7.6269 5.52112 9.79799C5.27568 10.0478 5.24604 10.1429 4.86458 10.1952C4.08761 10.3012 3.29163 10.3024 2.51428 10.4115C2.0272 10.3363 1.8794 10.0665 1.89802 9.58439C1.92727 8.81808 2.07279 8.02136 2.10888 7.25076C2.12028 7.13734 2.15258 7.04379 2.21185 6.9479C4.17727 4.8918 6.17233 2.86143 8.15942 0.825599C8.33761 0.643181 8.75554 0.136855 8.96185 0.0522721C9.22628 -0.0560873 9.45843 0.0105654 9.66777 0.191814C10.1473 0.605762 10.6587 1.21577 11.1074 1.68351L11.1077 1.6839ZM9.19703 1.5962L8.17955 2.65212L9.43715 3.92826L10.4554 2.86884L9.19665 1.59581L9.19703 1.5962ZM8.49338 4.91597L8.50212 4.8345L7.24832 3.58798L3.35736 7.59806L3.22553 9.02973C3.53935 9.00439 3.85242 8.96346 4.16511 8.93228C4.27682 8.92098 4.54809 8.93501 4.62902 8.88239L8.49338 4.91558V4.91597Z" fill="#315B42"/>
                    <path d="M7.57067 11.6962H0V13.0004H7.57067V11.6962Z" fill="#315B42"/>
                  </svg>
                </div>
              </div>

              <div style={{ width: '40%', color: '#315B4287', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ }}>Ship to: </div>
                <div style={{ width: '70%', textDecoration: 'underline' }}>{formatAddress(c.address)}</div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  </div>
}

export default SelectItems;