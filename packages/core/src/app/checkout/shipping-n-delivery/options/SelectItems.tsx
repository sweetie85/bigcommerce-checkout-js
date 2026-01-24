import { AddressRequestBody, Cart, Consignment, ConsignmentAssignmentRequestBody, ConsignmentLineItem, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { formatAddress } from "../../custom-utility";
import { useCheckout } from "../CheckoutContext";
import AddressOption from "./AddressOption";
import ShippingMethodOptionGroup from "./ShippingMethodOptionGroup";
import FutureShipDateOptionGroup from "./FutureShipDateOptionGroup";
import GiftMessageOptionGroup from "./GiftMessageOptionGroup";

interface SelectItemsProps {
  checkoutId: string;
  giftProducts: { bigcommerce_product_id: string, frontend_title: string }[];
  // selecedItemIds: string[];
  // onChangeSelectedItems: (ids: string[]) => void;
  // onSelectConsignment: (consignment: Consignment) => void;
}

const SelectItems = ({ checkoutId, giftProducts }: SelectItemsProps) => {
  const [mainCartItems, setMainCartItems] = useState<PhysicalItem[]>([]);
  const [showDetailsItemIds, setShowDetailsItemIds] = useState<number[]>([]);
  const [selecedItemIds, setSelecedItemIds] = useState<string[]>([]);
  
  const [isUpdateAddressChecked, setIsUpdateAddressChecked] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<AddressRequestBody | null>(null);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [holdingConsignment, setHoldingConsignment] = useState<Consignment | null>(null);
  const [unassignedLineItems, setUnassignedLineItems] = useState<PhysicalItem[]>([]);
  const [isNextStep, setIsNextStep] = useState<boolean>(false);

  const [futureShipDate, setFutureShipDate] = useState<string | null>(null);

  const { checkoutState, checkoutService } = useCheckout();

  const cart: Cart | undefined = checkoutState.data.getCart();
  const consignments: Consignment[] | undefined = checkoutState.data.getConsignments() ?? [];
  const customer = checkoutState.data.getCustomer();

  useEffect(() => {
    if (cart) {
      const mainItems = cart.lineItems.physicalItems.filter(c => !c.parentId);
      setMainCartItems(mainItems);

      // Detect if single consignments
      if (consignments.length == 1) {
        if (consignments[0].address.address1 != 'TO_BE_ASSIGNED') {
          console.log('createHoldingConsignment: ');
          // Move all items to dummy consignments
          createHoldingConsignment();
        }
      }

      const holdingConsignment = consignments.find(c => c.address.address1 == 'TO_BE_ASSIGNED');
      if (holdingConsignment) {
        console.log('holding consignment found.');
        console.log(consignments[0].lineItemIds);

        setHoldingConsignment(holdingConsignment);
        setUnassignedLineItems(mainItems.filter(i => holdingConsignment.lineItemIds.includes(i.id as string)));
      } else {
        setUnassignedLineItems([]);
        setSelecedItemIds([]);
      }
    }
  }, [consignments, cart]);

  const createHoldingConsignment = (items?: PhysicalItem[]) => {
    const PLACEHOLDER_ADDRESS = {
      countryCode: 'US',
      stateOrProvinceCode: 'CA',
      city: 'Temp',
      postalCode: '00000',
      address1: 'TO_BE_ASSIGNED',
    } as AddressRequestBody;

    if (cart) {

      // If no selected item
      if (!items) {
        // All items
        items = cart.lineItems.physicalItems;
      }

      checkoutService.createConsignments([{
        address: PLACEHOLDER_ADDRESS,
        lineItems: items.map(i => {
          return { itemId: i.id, quantity: i.quantity };
        }),
      }]);
    }
  }

  const handleChange = (e: any) => {
    const selectedId = e.target.value;
    toggleSelectedItemId(selectedId);
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

  const toggleSelectedItemId = (id: string) => {
    const index = selecedItemIds.indexOf(id);
    const newSelecedItemIds = [...selecedItemIds];
    
    if (index === -1) {
      // number not exist → add it
      newSelecedItemIds.push(id);
    } else {
      // number exist → remove it
      newSelecedItemIds.splice(index, 1);
    }

    setSelecedItemIds(newSelecedItemIds)
  }

  const handleAddressChange = (updatedAddress: AddressRequestBody) => {
    console.log('setShippingAddress 2: ');
    setShippingAddress(updatedAddress); // ✅ Update single source of truth
  };

  const updateConsignments = async (giftItem: ConsignmentLineItem | null) : Promise<Consignment | null> => {

    const cart = checkoutState.data.getCart();

    if (cart) {
      const lineItems = cart.lineItems.physicalItems
        .filter(i => selecedItemIds.length == 0 || selecedItemIds.includes(i.id as string))
        .map(i => {
          return { itemId: i.id, quantity: i.quantity };
        }) as ConsignmentLineItem[];

      console.log('Gift Item:');
      console.log(giftItem);

      if (giftItem) {
        lineItems.push(giftItem);
      }

      const updatedAddress = isUpdateAddressChecked && shippingAddress ? shippingAddress : selectedConsignment?.address;
      // if (updatedAddress && futureShipDate) {
      //   updatedAddress.customFields.push({
      //     fieldId: 'field_26',
      //     fieldValue: futureShipDate,
      //   });
      // }

      const requestBody = {
          address: updatedAddress,
          shippingAddress: updatedAddress,
          lineItems: lineItems,
        } as ConsignmentAssignmentRequestBody;

      const res = await checkoutService.assignItemsToAddress(requestBody);
      const updatedConsignments = res.data.getConsignments();

      // Reset future ship date after saving
      // setFutureShipDate(null);
      setIsUpdateAddressChecked(false);

      if (updatedConsignments) {
        const selectedConsignment = updatedConsignments.find(c =>
          c.lineItemIds.some(id => selecedItemIds.includes(id))
        );

        return selectedConsignment ?? null;
      }
    }

    return null;
  }

  const saveChanges = async () => {
    await updateConsignments(null);
  }

  const unassignItem = async (item: PhysicalItem) => {
    // Move item to holding consignment
    if (holdingConsignment) {
      const requestBody = {
        address: holdingConsignment.address,
        shippingAddress: holdingConsignment.address,
        lineItems: [{
          itemId: item.id,
          quantity: item.quantity
        }],
      } as ConsignmentAssignmentRequestBody;

      await checkoutService.assignItemsToAddress(requestBody);
    } else {
      createHoldingConsignment([item]);
    }
  }

  const unassignConsignment = async (consignment: Consignment) => {

    const items = mainCartItems.filter(i => consignment.lineItemIds.includes(i.id as string));
    const consignmentItems = items.map(i => ({ itemId: i.id, quantity: i.quantity }));

    // Move item to holding consignment
    if (holdingConsignment) {
      const requestBody = {
        address: holdingConsignment.address,
        shippingAddress: holdingConsignment.address,
        lineItems: consignmentItems,
      } as ConsignmentAssignmentRequestBody;

      await checkoutService.assignItemsToAddress(requestBody);
    } else {
      createHoldingConsignment(items);
    }
  }

  return <div style={{marginTop: '20px'}}>
      <p className="step-title">2. Select an item(s) to add a delivery address. Apply future ship date and an optional gift message for each destination.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>

      {/* <p>Seletected Items</p> */}
      {/* Iterate through every consignmets and filter items */}
      <div style={{ margin: '0 10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {unassignedLineItems.filter(i => selecedItemIds.includes(i.id as string)).map(i => <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
          <input type="checkbox" value={i.id} checked={selecedItemIds.includes(i.id as string)} onChange={handleChange} />
          
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#80988778', boxShadow: '0px 4px 4px 0px #00000026',  paddingBlock: '5px', paddingInline: '10px', borderRadius: '20px', width: "100%" }}>
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
            </div>
          </div>
        </div> )}

        {selecedItemIds.length > 0 && <>
          <AddressOption 
            isUpdateAddressChecked={isUpdateAddressChecked}
            setIsUpdateAddressChecked={setIsUpdateAddressChecked}
            updatedShippingAddress={shippingAddress} 
            onInputChange={handleAddressChange}
            selectedConsignment={selectedConsignment}
          />

          {(!customer || customer.isGuest) &&
            <div style={{ marginTop: '30px' }}>
              <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>CONTINUE</button>
            </div>
          }

          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>SAVE CHANGES</button>
          </div>
        </>}
      </div>

      {/* <p>UnSeletected Items: </p> */}
      {/* Iterate through every consignmets and filter items */}
      <div style={{ margin: '0 10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {unassignedLineItems.filter(i => !selecedItemIds.includes(i.id as string)).map(i => <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
          <input type="checkbox" value={i.id} checked={selecedItemIds.includes(i.id as string)} onChange={handleChange} />
          
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', boxShadow: '0px 4px 4px 0px #00000026',  paddingBlock: '5px', paddingInline: '10px', borderRadius: '20px', width: "100%" }}>
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
            </div>
          </div>
        </div> )}
      </div>
      
      {consignments.length > 1 && <>

        {/* <p>Consignments: </p> */}
        
        {/* Iterate through every consignmets and filter items */}
        { consignments.filter(c => c.address.address1 !== 'TO_BE_ASSIGNED').map(c => <div key={c.id} style={{ margin: '0 10px', backgroundColor: '#c7cfc5', boxShadow: '0px 4px 4px 0px #00000026', borderRadius: '20px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mainCartItems.filter(i => c.lineItemIds.includes(i.id as string))
            .map(i => <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              
              {/* { (consignments.length < 2 || selecedItemIds.length > 0) &&
                <input type="checkbox" value={i.id} checked={selecedItemIds.includes(i.id as string)} onChange={handleChange} />
              } */}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingInline: '20px', paddingBlock: '5px', width: "100%" }}>
                
                <div style={{ position: 'relative', display: 'flex', gap: '12px' }}>
                  <div onClick={() => unassignItem(i)} style={{ position: 'absolute', left: '-4px', top: '-4px', cursor: 'pointer' }}>
                    <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="14.5" cy="14.5" r="14" fill="#D9D9D9" stroke="#315B42"/>
                      <path d="M12.7715 9.785L15.2615 13.55H14.7515L17.2265 9.785H19.8665L16.1765 15.185L16.0865 14.48L19.8965 20H17.1965L14.5865 16.1H15.3215L12.7415 20H10.0415L13.8065 14.48L13.8215 15.185L10.1465 9.785H12.7715Z" fill="#315B42"/>
                    </svg>
                  </div>
                  <img style={{ maxWidth: '100px', maxHeight: '200px' }} src={i.imageUrl} />
                
                  <div style={{ fontWeight: 'bold', marginLeft: '10px' }}>
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
                </div>
                <div style={{ fontWeight: 'bold' }} className="product-price">
                  <div>${i.salePrice}</div>
                  <div>{c.selectedShippingOption?.description}</div>
                </div>
              </div>
            </div>
          )}
            <div style={{ width: '100%', padding: "20px 10px", backgroundColor: '#8da292'}}>
              <div style={{fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ }}>All items in this group ship to: </span>
                  <span style={{ textDecoration: 'underline', color: '#fff' }}>{formatAddress(c.address)}</span>
                </div>
                <div>
                  <a onClick={() => unassignConsignment(c)} style={{ textDecoration: 'underline', color: '#000' }}>Ungroup Items</a>
                </div>
              </div>
              { isNextStep &&
              <div className="" style={{ display: "flex", gap: '24px', marginTop: '20px' }}>
                <div>
                  <ShippingMethodOptionGroup 
                    handleChange={(id) => {
                      console.log('ShippingMethodOption id: '+id);
                      // setSelectedShippingOptionId(id);
                    }}
                    updatedShippingOptionId={c.selectedShippingOption ? c.selectedShippingOption.id : null}
                    selectedConsignment={c}
                  />
                </div>
                <div>
                  <FutureShipDateOptionGroup 
                    futureShipDate={futureShipDate} 
                    handleChangeDate={(date) => setFutureShipDate(date)}
                    selectedConsignment={c}
                    />
                </div>
                <div>
                  <GiftMessageOptionGroup 
                    giftProducts={giftProducts}
                    selectedConsignment={c}
                    checkoutId={checkoutId}
                  />
                </div>
                <button onClick={() => setIsNextStep(true)} style={{ fontWeight: 'bold', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '5px' }}>Save</button>
              </div>
              }
            </div>

          </div>
        )}
      </>}
    </div>

    <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'right', alignItems: 'center', gap: '20px' }}>
      {unassignedLineItems.length > 0 ? <>
        <div style={{ color: '#EB2F2F', fontWeight: 500, fontSize: '20px' }}>*Assign delivery address to all items before continuing.</div>
        <button disabled style={{ opacity: '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>NEXT STEP</button>
      </>
      :
        <button onClick={() => setIsNextStep(true)} style={{ backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>NEXT STEP</button>
      }
    </div>
  </div>
}

export default SelectItems;