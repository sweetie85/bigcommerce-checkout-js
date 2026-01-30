import { AddressRequestBody, Cart, Consignment, ConsignmentAssignmentRequestBody, ConsignmentLineItem, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { formatAddress } from "../../custom-utility";
import { useCheckout } from "../CheckoutContext";
import AddressOption from "./AddressOption";
import ShippingMethodOptionGroup from "./ShippingMethodOptionGroup";
import FutureShipDateOptionGroup from "./FutureShipDateOptionGroup";
import GiftMessageOptionGroup from "./GiftMessageOptionGroup";
import AddressOptionGroup from "./AddressOptionGroup";

interface SelectItemsProps {
  checkoutId: string;
  giftProducts: { bigcommerce_product_id: string, frontend_title: string }[];
  // selecedItemIds: string[];
  // onChangeSelectedItems: (ids: string[]) => void;
  // onSelectConsignment: (consignment: Consignment) => void;
  setIsInProgress: (inProgress: boolean) => void;
  gotoNextStep: () => void;
}

const SelectItems = ({ checkoutId, giftProducts, setIsInProgress, gotoNextStep }: SelectItemsProps) => {
  const [mainCartItems, setMainCartItems] = useState<PhysicalItem[]>([]);
  const [showDetailsItemIds, setShowDetailsItemIds] = useState<number[]>([]);
  const [selecedItemIds, setSelecedItemIds] = useState<string[]>([]);
  
  const [isUpdateAddressChecked, setIsUpdateAddressChecked] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<AddressRequestBody | null>(null);
  const [shippingAddressError, setShippingAddressError] = useState<string | null>(null);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [holdingConsignment, setHoldingConsignment] = useState<Consignment | null>(null);
  const [unassignedLineItems, setUnassignedLineItems] = useState<PhysicalItem[]>([]);
  const [isNextStep, setIsNextStep] = useState<boolean>(false);
  const [isGoTOOrderSummary, setIsGoTOOrderSummary] = useState<boolean>(false);

  const [selectedShippingOptionIds, setSelectedShippingOptionIds] = useState<Record<string, string>>({});
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

        setIsNextStep(false);
        setIsGoTOOrderSummary(false);
      } else {
        setUnassignedLineItems([]);
        setSelecedItemIds([]);
        setIsNextStep(true);
      }
    }
  }, [consignments, cart]);

  useEffect(() => {
    if (shippingAddress) {
      setShippingAddressError(null);
    }
  }, [shippingAddress])

  // Verify if all consignment are assinged a shipping method
  useEffect(() => {
    const pendingShipppingMethod = consignments.find(c => !c.selectedShippingOption && c.address.address1 != 'TO_BE_ASSIGNED'  && (!selectedShippingOptionIds[c.id] || selectedShippingOptionIds[c.id] == ''));
    const pendingShipppingMethodEdit = consignments.find(c => c.address.address1 != 'TO_BE_ASSIGNED' && selectedShippingOptionIds[c.id] == '');

    if (!pendingShipppingMethod && !pendingShipppingMethodEdit) {
      setIsGoTOOrderSummary(true);
    } else {
      setIsGoTOOrderSummary(false);
    }
  }, [consignments, selectedShippingOptionIds]);

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

  const handleChange = (selectedId: string) => {
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

      const updatedAddress = shippingAddress;
      if (!updatedAddress) {
        setShippingAddressError('Please select shipping address!');
        return null;
      }

      if (updatedAddress && futureShipDate) {
        updatedAddress.customFields.push({
          fieldId: 'field_26',
          fieldValue: futureShipDate,
        });
      }

      const requestBody = {
          address: updatedAddress,
          shippingAddress: updatedAddress,
          lineItems: lineItems,
        } as ConsignmentAssignmentRequestBody;

      const res = await checkoutService.assignItemsToAddress(requestBody);
      const updatedConsignments = res.data.getConsignments();

      // reset shipping details form once saved
      setFutureShipDate(null);
      setIsUpdateAddressChecked(false);
      setSelecedItemIds([]);
      setShippingAddress(null);
      setShippingAddressError(null);

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
    setIsInProgress(true);
    await updateConsignments(null);
    setIsInProgress(false);
  }

  const saveShippingMethods = async () => {

    setIsInProgress(true);

    for (const [consignmentId, shippingMethodId] of Object.entries(selectedShippingOptionIds)) {
      // Save shipping method
      if (shippingMethodId && shippingMethodId != '') {
        await checkoutService.selectConsignmentShippingOption(consignmentId, shippingMethodId);
      }
    }

    setIsInProgress(false);
    gotoNextStep();
  }

  const unassignItem = async (item: PhysicalItem) => {

    setIsInProgress(true);

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

    setIsInProgress(false);

  }

  const unassignConsignment = async (consignment: Consignment) => {

    setIsInProgress(true);

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

    setIsInProgress(false);
  }

  return <div className="consignments-wrapper">
    <p className="step-title">
      2. Select an item(s) to add a delivery address. Apply future ship date and an optional gift message for each destination.
    </p>

    <div className="assignment-categories">

    {consignments.length > 1 && <>

      {/* <p>Consignments: </p> */}
      
      {/* Iterate through every consignmets and filter items */}
      { consignments.filter(c => c.address.address1 !== 'TO_BE_ASSIGNED').map(c => <div key={c.id} style={{ margin: '0 10px', backgroundColor: '#c7cfc5', boxShadow: '0px 4px 4px 0px #00000026', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {mainCartItems.filter(i => c.lineItemIds.includes(i.id as string))
          .map(i => <div key={i.id} style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            
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
          <div style={{ width: '100%', borderBottomRightRadius: '20px', borderBottomLeftRadius: '20px', padding: "20px", backgroundColor: '#8da292'}}>
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
              <div style={{ display: "flex", gap: '8px' }}>
                <ShippingMethodOptionGroup 
                  handleChange={(id) => {
                    setSelectedShippingOptionIds({ ...selectedShippingOptionIds, [c.id]: id });
                  }}
                  selectedConsignment={c}
                />

                {/* <button onClick={() => saveShippingMethod(c)} style={{ fontWeight: 'bold', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '5px' }}>Save</button> */}
              </div>
              <div>
                {/* <FutureShipDateOptionGroup 
                  futureShipDate={futureShipDates[c.id]} 
                  handleChangeDate={(date) => setFutureShipDates({ ...futureShipDates, [c.id]: date })}
                  selectedConsignment={c}
                  /> */}
                  <input placeholder="Future Ship Date" readOnly value={c.address.customFields.find(c => c.fieldId == 'field_26')?.fieldValue} style={{ width: '300px', padding: '10px', fontSize: '14px' }} type="text" />
              </div>
              <div>
                <GiftMessageOptionGroup 
                  giftProducts={giftProducts}
                  selectedConsignment={c}
                  checkoutId={checkoutId}
                  setIsInProgress={setIsInProgress}
                />
              </div>
            </div>
            }
          </div>

        </div>
      )}
    </>}

      {/* <p>Seletected Items</p> */}
      {/* Iterate through every consignmets and filter items */}
      <div className="assignment-category-wrapper selected-items">
        {unassignedLineItems.filter(i => selecedItemIds.includes(i.id as string)).map(i => <div className="item-card-wrapper" key={i.id} onClick={() => handleChange(i.id as string)}>
            
          <input type="checkbox" value={i.id} checked={selecedItemIds.includes(i.id as string)} />
          
          <div className="item-card">
            <div style={{ width: '20%' }}><img className="item-card__image" src={i.imageUrl} /></div>
            <div style={{ width: '60%', fontWeight: 'bold' }}>
              <div className="product-title">{i.quantity} x {i.name}</div>

              {(i.options && i.options.length > 0) ?
                (showDetailsItemIds.includes(i.id as number) ?
                  <div>
                    {i.options?.map(o => <div key={o.nameId} style={{ fontWeight: '500' }} className="product-option">{o.name} {o.value}</div>)}
                    <div className="item-card__toggle-view" onClick={() => toggleViewDetails(i.id as number)}>View Less</div>
                  </div>
                  : 
                  <div className="item-card__toggle-view" onClick={() => toggleViewDetails(i.id as number)}>View Details</div>
                )
              : <></>}
            </div>
            <div style={{ width: '15%', fontWeight: 'bold' }} className="product-price">
              <div>${i.salePrice}</div>
            </div>
          </div>
        </div> )}

        {selecedItemIds.length > 0 && <div>
          <AddressOptionGroup 
            isUpdateAddressChecked={isUpdateAddressChecked}
            setIsUpdateAddressChecked={setIsUpdateAddressChecked}
            updatedShippingAddress={shippingAddress} 
            onInputChange={handleAddressChange}
            selectedConsignment={selectedConsignment}
            futureShipDate={futureShipDate}
            setFutureShipDate={(date) => setFutureShipDate(date)}
          />

          {shippingAddressError && <p style={{ color: 'red', fontWeight: 'bold' }}>{shippingAddressError}</p>}

          {(!customer || customer.isGuest) &&
            <div style={{ marginTop: '30px' }}>
              <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>CONTINUE</button>
            </div>
          }

          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>SAVE CHANGES</button>
          </div>
        </div>}
      </div>

      {/* <p>UnSeletected Items: </p> */}
      {/* Iterate through every consignmets and filter items */}
      <div className="assignment-category-wrapper un-selected-items">
        {unassignedLineItems.filter(i => !selecedItemIds.includes(i.id as string)).map(i => <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}  onClick={() => handleChange(i.id as string)}>
            
          <input type="checkbox" value={i.id} checked={selecedItemIds.includes(i.id as string)} />
          
          <div className="item-card">
            <div style={{ width: '20%' }}><img className="item-card__image" src={i.imageUrl} /></div>
            <div style={{ width: '60%', fontWeight: 'bold' }}>
              <div className="product-title">{i.quantity} x {i.name}</div>

              {(i.options && i.options.length > 0) ?
                (showDetailsItemIds.includes(i.id as number) ?
                  <div>
                    {i.options?.map(o => <div key={o.nameId} style={{ fontWeight: '500' }} className="product-option">{o.name} {o.value}</div>)}
                    <div className="item-card__toggle-view" onClick={() => toggleViewDetails(i.id as number)}>View Less</div>
                  </div>
                  : 
                  <div className="item-card__toggle-view" onClick={() => toggleViewDetails(i.id as number)}>View Details</div>
                )
              : <></>}
            </div>
            <div style={{ width: '15%', fontWeight: 'bold' }} className="product-price">
              <div>${i.salePrice}</div>
            </div>
          </div>
        </div> )}
      </div>
      
      
    </div>

    {/* Buttom Buttons */}
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      { isNextStep ?
        <div className="step-title" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }} onClick={() => { setIsNextStep(false) }}>
          <svg style={{ transform: 'rotate(180deg)' }} width="9" height="14" viewBox="0 0 9 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.14483 0L9 6.97857L2.14483 14L0 11.7841L4.70206 7.02143L0 2.21585L2.14483 0Z" fill="#315B42"/>
          </svg>
          <label style={{ marginLeft: '10px', textDecoration: 'underline' }}>Previous Step</label>
        </div>
      :
        <div></div>
      }

      <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'right', alignItems: 'center', gap: '20px' }}>
        {unassignedLineItems.length > 0 ? <>
          <div style={{ color: '#EB2F2F', fontWeight: 500, fontSize: '20px', maxWidth: '400px' }}>*Assign delivery address to all items before continuing.</div>
          <button disabled style={{ opacity: '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>NEXT STEP</button>
        </>
        :
          <>
            { !isNextStep &&
              <button onClick={() => { setIsNextStep(true) }} style={{ backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>NEXT STEP</button>
            }
            { isNextStep && !isGoTOOrderSummary ?
              <>
                <div style={{ color: '#EB2F2F', fontWeight: 500, fontSize: '20px', maxWidth: '400px' }}>**Choose shipping method and date for all groups before continuing.</div>
                <button disabled style={{ opacity: '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
              </>
            :
              isNextStep && <button onClick={() => saveShippingMethods()} style={{ backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
            }
          </>
        }
        
      </div>
    </div>
  </div>
}

export default SelectItems;