import { AddressRequestBody, Cart, Consignment, ConsignmentAssignmentRequestBody, ConsignmentLineItem, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { formatAddress } from "../../custom-utility";
import { useCheckout } from "../CheckoutContext";
import AddressOption from "./AddressOption";
import ShippingMethodOptionGroup from "./ShippingMethodOptionGroup";
import FutureShipDateOptionGroup from "./FutureShipDateOptionGroup";
import GiftMessageOptionGroup from "./GiftMessageOptionGroup";
import AddressOptionGroup from "./AddressOptionGroup";
import ConsignmentItemCard from "../components/ConsignmentItemCard";

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
  const [giftItemError, setGiftItemError] = useState<string | null>(null);

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

  const updateConsignments = async () => {

    const cart = checkoutState.data.getCart();

    if (cart) {
      const lineItems = cart.lineItems.physicalItems
        .filter(i => selecedItemIds.length == 0 || selecedItemIds.includes(i.id as string))
        .map(i => {
          return { itemId: i.id, quantity: i.quantity };
        }) as ConsignmentLineItem[];

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

      try {
        await checkoutService.assignItemsToAddress(requestBody);
      } catch(e: unknown) {
        if (e instanceof Error) {
          setGiftItemError(e.message);
        } else {
          console.log('Unexpected Error:');
          console.log(e);
        }
      }

      // reset shipping details form once saved
      setFutureShipDate(null);
      setIsUpdateAddressChecked(false);
      setSelecedItemIds([]);
      setShippingAddress(null);
      setShippingAddressError(null);
    }
  }

  const saveChanges = async () => {
    setIsInProgress(true);
    await updateConsignments();
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
    <div className="step-2-title step-title">
      <span>2. </span>
      <span>Select an item to add a delivery address; select & group items going to the same address.</span>
    </div>

    <div className="assignment-categories">

    {consignments.length > 1 && <>

      {/* <p>Consignments: </p> */}
      
      {/* Iterate through every consignmets and filter items */}
      { consignments.filter(c => c.address.address1 !== 'TO_BE_ASSIGNED').map(c => <div key={c.id} style={{ margin: '0 10px', backgroundColor: '#c7cfc5', boxShadow: '0px 4px 4px 0px #00000026', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {mainCartItems.filter(i => c.lineItemIds.includes(i.id as string))
          .map(i => <div key={i.id} className="item-card-wrapper">
            <ConsignmentItemCard i={i} unassignItem={(i) => unassignItem(i)} />
          </div>
        )}
          <div className="item-options-wrapper">
            <div className="item-options__unassign-consignment">
              <div className="assigned-address-line">
                <div className="line-1">All items in this group ship to: </div>
                <div className="line-2" style={{ color: '#fff' }}>{formatAddress(c.address)}</div>
              </div>
              <div>
                <a onClick={() => unassignConsignment(c)} style={{ textDecoration: 'underline', color: '#000' }}>Ungroup Items</a>
              </div>
            </div>
            { isNextStep &&
            <div className="item-options item-options__shipping-option-wrapper">
              <div style={{ display: 'flex', gap: '24px' }}>
                <div className="item-options__shipping-option">
                  <ShippingMethodOptionGroup 
                    handleChange={(id) => {
                      setSelectedShippingOptionIds({ ...selectedShippingOptionIds, [c.id]: id });
                    }}
                    selectedConsignment={c}
                  />
                </div>
                <div className="item-options__ship_date">
                  <input className="future-ship-date-value" placeholder="Future Ship Date" readOnly value={c.address.customFields.find(c => c.fieldId == 'field_26')?.fieldValue} style={{ padding: '10px', fontSize: '14px' }} type="text" />
                </div>
              </div>
              <div className="item-options__gift-message flex-align-center">
                <GiftMessageOptionGroup 
                  giftProducts={giftProducts}
                  selectedConsignment={c}
                  checkoutId={checkoutId}
                  setIsInProgress={setIsInProgress}
                  giftItemError={giftItemError}
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
      { selecedItemIds.length > 0 &&
        <div className="assignment-category-wrapper selected-items">
          {unassignedLineItems.filter(i => selecedItemIds.includes(i.id as string)).map(i => <div className="item-card-wrapper" key={i.id}>
              
            <input type="checkbox" onChange={() => handleChange(i.id as string)} value={i.id} checked={selecedItemIds.includes(i.id as string)} />
            
            <div className="item-card">
              <ConsignmentItemCard i={i} />
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
              saveChanges={saveChanges}
            />

            {shippingAddressError && <p style={{ color: 'red', fontWeight: 'bold' }}>{shippingAddressError}</p>}

            {(!customer || customer.isGuest) &&
              <div style={{ marginTop: '30px' }}>
                <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>CONTINUE</button>
              </div>
            }
          </div>}
        </div>
      }

      {/* <p>UnSeletected Items: </p> */}
      {/* Iterate through every consignmets and filter items */}
      <div className="assignment-category-wrapper un-selected-items">
        {unassignedLineItems.filter(i => !selecedItemIds.includes(i.id as string)).map(i => <div key={i.id} className="item-card-wrapper">
            
          <input type="checkbox" onChange={() => handleChange(i.id as string)} value={i.id} checked={selecedItemIds.includes(i.id as string)} />
          
          <div className="item-card">
            <ConsignmentItemCard i={i} />
          </div>
        </div> )}
      </div>
      
      
    </div>

    {/* Buttom Buttons */}
    <div className="next-step-buttons-wrapper">
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
          <div className="desktop-only" style={{ color: '#EB2F2F', fontSize: '14px', maxWidth: '400px' }}>*Assign delivery address to all items before continuing.</div>
          <button disabled style={{ opacity: '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>NEXT STEP</button>
        </>
        :
          <>
            { !isNextStep &&
              <button onClick={() => { setIsNextStep(true) }} style={{ backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>NEXT STEP</button>
            }
            { isNextStep && !isGoTOOrderSummary ?
              <>
                <div className="desktop-only" style={{ color: '#EB2F2F', fontSize: '16px', maxWidth: '400px' }}>**Choose shipping method and date for all groups before continuing.</div>
                <button disabled style={{ opacity: '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
              </>
            :
              isNextStep && <button onClick={() => saveShippingMethods()} style={{ backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
            }
          </>
        }
        
      </div>
    </div>

    <div className="mobile-only" style={{ display: 'flex', justifyContent: 'right' }}>
      {unassignedLineItems.length > 0 &&
        <div className="mobile-only" style={{ color: '#EB2F2F', fontSize: '14px', maxWidth: '250px' }}>*Assign delivery address to all items before continuing.</div>
      }

      { (isNextStep && !isGoTOOrderSummary) &&
        <div className="mobile-only" style={{ color: '#EB2F2F', fontSize: '14px', maxWidth: '250px' }}>**Choose shipping method and date for all groups before continuing.</div>
      }

    </div>
  </div>
}

export default SelectItems;