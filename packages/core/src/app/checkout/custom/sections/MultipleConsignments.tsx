import { Cart, Consignment, ConsignmentAssignmentRequestBody, ConsignmentLineItem, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { formatAddress } from "../../custom-utility";
import { useCheckout } from "../context/CheckoutContext";
import ShippingMethodOptionGroup from "../options/ShippingMethodOptionGroup";
import FutureShipDateOptionGroup from "../options/FutureShipDateOptionGroup";
import GiftMessageOptionGroup from "../options/GiftMessageOptionGroup";
import AddressOptionGroup from "../options/AddressOptionGroup";
import ConsignmentItemCard from "../components/ConsignmentItemCard";
import ConfirmDialog from "../components/ConfirmDialog";
import { GiftProduct, CustomItem, CustomAddressRequestBody } from "../types";
import GiftMessageOptionGroupEdit from "../options/GiftMessageOptionGroupEdit";
import { handleCheckoutError, validateAddress } from "../utility";

interface SelectItemsProps {
  checkoutId: string;
  giftProducts: GiftProduct[];
  setIsInProgress: (inProgress: boolean) => void;
  gotoNextStep: () => void;
  setIsSingleAddress: (isSet: boolean) => void;
  setShowTopSteps: (isShow: boolean) => void;
  stepNumber: number;
}

const MultipleConsignments = ({ 
  checkoutId, 
  giftProducts, 
  setIsInProgress, 
  setShowTopSteps,
  gotoNextStep, 
  setIsSingleAddress, 
  stepNumber 
}: SelectItemsProps) => {
  const [mainCartItems, setMainCartItems] = useState<CustomItem[]>([]);
  const [selecedItemIds, setSelecedItemIds] = useState<number[]>([]);
  
  const [isUpdateAddressChecked, setIsUpdateAddressChecked] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<CustomAddressRequestBody | null>(null);
  const [shippingAddressError, setShippingAddressError] = useState<string | null>(null);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [holdingConsignment, setHoldingConsignment] = useState<Consignment | null>(null);
  const [unassignedLineItems, setUnassignedLineItems] = useState<CustomItem[]>([]);
  const [isNextStep, setIsNextStep] = useState<boolean>(false);
  const [isGoTOOrderSummary, setIsGoTOOrderSummary] = useState<boolean>(false);

  const [selectedShippingOptionIds, setSelectedShippingOptionIds] = useState<Record<string, string>>({});
  const [futureShipDate, setFutureShipDate] = useState<string | null>(null);
  const [giftItemError, setGiftItemError] = useState<string | null>(null);
  const [isShowSingleAddressConfirmation, setIsShowSingleAddressConfirmation] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { checkoutState, checkoutService, storeConfig } = useCheckout();

  const cart: Cart | undefined = checkoutState.data.getCart();
  const consignments: Consignment[] | undefined = checkoutState.data.getConsignments() ?? [];
  const { futureShipDateFieldId: FUTURE_SHIP_DATE_FIELD_ID } = storeConfig;
  const { emailAddressFieldId: EMAIL_ADDRESS_FIELD_ID } = storeConfig;

  useEffect(() => {
    if (cart) {
      const physicalItems = cart.lineItems.physicalItems.filter(c => !c.parentId);
      const mainItems = [] as CustomItem[];

      // SPLIT THE QUANTITY INTO SEPERATE LINE ITEMS.
      let itemIndex = 0;
      physicalItems.forEach((item) => {
        for(let i = 0; i < item.quantity; i++) {
          mainItems.push({ itemIndex, item });
          itemIndex++;
        }
      });

      setMainCartItems(mainItems);

      const isConsignmentAssignedManually = window.sessionStorage.getItem('CCC-PARAM--consignment-is-assigned-manually');
      console.log('isConsignmentAssignedManually: ');
      console.log(isConsignmentAssignedManually);

      // Detect if single consignments
      if (!isConsignmentAssignedManually && consignments.length <= 1) {
        if (consignments.length == 0 || consignments[0].address.address1 != 'TO_BE_ASSIGNED') {
          // console.log('createHoldingConsignment: ');
          // Move all items to dummy consignments
          createHoldingConsignment();
        }
      }

      if (isConsignmentAssignedManually && consignments.length == 1 && consignments[0].address.address1 != 'TO_BE_ASSIGNED') {
        window.sessionStorage.removeItem('CCC-PARAM--consignment-is-assigned-manually');
        setIsShowSingleAddressConfirmation(true);
      }

      const holdingConsignment = consignments.find(c => c.address.address1 == 'TO_BE_ASSIGNED');
      if (holdingConsignment) {
        // console.log('holding consignment found.');
        // console.log(consignments[0].lineItemIds);

        const holdingGiftItems = mainItems.filter(i => isGiftItem(i.item) && holdingConsignment.lineItemIds.includes(i.item.id as string))
        console.log('holdingGiftItems: ');
        console.log(holdingGiftItems);

        // Delete gift items
        for(let i = 0; i < holdingGiftItems.length; i++) {
      
          console.log(`Deleting gift item: ${holdingGiftItems[i].item.id}`);

          fetch(`/api/storefront/carts/${checkoutId}/items/${holdingGiftItems[i].item.id}`, {
            method: 'DELETE',
            credentials: 'same-origin'
          });
        }

        setHoldingConsignment(holdingConsignment);
        setUnassignedLineItems(mainItems.filter(i => !isGiftItem(i.item) && holdingConsignment.lineItemIds.includes(i.item.id as string)));

        setIsNextStep(false);
        setIsGoTOOrderSummary(false);
      } else {
        setUnassignedLineItems([]);
        setSelecedItemIds([]);
        // setIsNextStep(true);
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

  useEffect(() => {
    if (isNextStep) {
      setShowTopSteps(false);
    } else {
      setShowTopSteps(true);
    }
  }, [isNextStep]);

  const createHoldingConsignment = (items?: PhysicalItem[]) => {
    const PLACEHOLDER_ADDRESS = {
      countryCode: 'US',
      stateOrProvinceCode: 'CA',
      city: 'Temp',
      postalCode: '00000',
      address1: 'TO_BE_ASSIGNED',
    } as CustomAddressRequestBody;

    if (cart) {

      // If no selected item
      if (!items) {
        // All items
        items = cart.lineItems.physicalItems.filter(c => !c.parentId);
      }

      setIsInProgress(true);

      checkoutService.createConsignments([{
        address: PLACEHOLDER_ADDRESS,
        lineItems: items.map(i => {
          return { itemId: i.id, quantity: i.quantity };
        }),
      }]);

      setIsInProgress(false);
    }
  }

  // const handleChange = (selectedId: string) => {
  //   toggleSelectedItemId(selectedId);
  // }

  const toggleSelectedItemId = (id: number) => {
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

  const handleAddressChange = (updatedAddress: CustomAddressRequestBody) => {
    // console.log('setShippingAddress 2: ');
    setShippingAddress(updatedAddress); // ✅ Update single source of truth
  };

  /*
  const addFutureShipDateToCart = async (futureShipDate: string): Promise<PhysicalItem | null> => {

    // console.log('addFutureShipDateToCart: ');

    const [productId, optionId] = ['140', '148'];

    const lineItems = [];
    const lineItem = {
      quantity: 1,
      productId: parseInt(productId),
      optionSelections: [{
        optionId: parseInt(optionId),
        optionValue: futureShipDate
      }],
    };

    lineItems.push(lineItem);

    const endpoint = `/api/storefront/cart/${checkoutId}/items`;

    const payload = { lineItems };

    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(payload)
    });

    if(!res.ok) {
      const error = await res.json();
      console.error('Add item error:', error);
      alert('Error adding add-ons: ' + (error.title || 'Unknown error'));
      
      setIsInProgress(false);
      return null;
    } else {

      // console.log('Item added successfully.');
      // window.location.reload();
      // console.log(res);

      const response = await res.json();
      const physicalItems = response.lineItems.physicalItems as PhysicalItem[];

      // Collect only main products
      const cartItems = physicalItems.filter(i => !i.parentId);
      const lastItem = cartItems[cartItems.length - 1];

      return lastItem;
    }
  }
  */

  const updateConsignments = async () => {

    const cart = checkoutState.data.getCart();

    if (!shippingAddress) {
      setErrorMessage('Please enter shipping address!');
      return null;
    }

    if (cart && shippingAddress) {
      // Check if all items are assigned to single address
      // const cartItems = cart.lineItems.physicalItems.filter(i => !i.parentId);
      // if (selecedItemIds.length == cartItems.length) {
      //   setIsShowSingleAddressConfirmation(true);
      //   return;
      // }

      // Validate address
      if (!validateAddress(shippingAddress, setErrorMessage)) {
        return null;
      } else {
        setErrorMessage(null);
      }

      const lineItems = mainCartItems.filter(i => selecedItemIds.length == 0 || selecedItemIds.includes(i.itemIndex))
        .map(i => {
          return { itemId: i.item.id, quantity: 1 };
        }) as ConsignmentLineItem[];

      const updatedAddress = shippingAddress;
      if (!updatedAddress) {
        setShippingAddressError('Please select shipping address!');
        return null;
      }

      if (updatedAddress && futureShipDate) {

        const futureDateCustomData = {
          fieldId: FUTURE_SHIP_DATE_FIELD_ID,
          fieldValue: futureShipDate,
        };

        if (updatedAddress.customFields) {
          updatedAddress.customFields.push(futureDateCustomData);
        } else {
          updatedAddress.customFields = [futureDateCustomData];
        }
      }

      if (updatedAddress && updatedAddress.emailAddress) {

        const emailAddressCustomData = {
          fieldId: EMAIL_ADDRESS_FIELD_ID,
          fieldValue: updatedAddress.emailAddress,
        };

        if (updatedAddress.customFields) {
          updatedAddress.customFields.push(emailAddressCustomData);
        } else {
          updatedAddress.customFields = [emailAddressCustomData];
        }


        // Add new product: SH-DATE
        /*
        const shipDateItem = await addFutureShipDateToCart(futureShipDate);

        // console.log('shipDateItem: ');
        // console.log(shipDateItem);

        if (shipDateItem) {
          lineItems.push({ itemId: shipDateItem.id, quantity: 1 });
        }
        */
      }
      
      const requestBody = {
        address: updatedAddress,
        shippingAddress: updatedAddress,
        lineItems: lineItems,
      } as ConsignmentAssignmentRequestBody;

      try {
        await checkoutService.assignItemsToAddress(requestBody);
      } catch(e: unknown) {
        const messages = handleCheckoutError(e);
        // messages.forEach(msg => alert(msg));
        if (messages.length > 0) {
          setErrorMessage(messages[0]);
          return null;
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

  async function updateFutureShipDate(consignment: Consignment, dateString: string) {
    if (!consignment || !cart || !dateString || dateString == '') {
      return null;
    }
    const existingAddress = consignment.shippingAddress;

    if (!existingAddress) {
      throw new Error('Consignment has no shipping address');
    }

    // Merge custom fields (overwrite by fieldId)
    const mergedCustomFieldsMap = new Map();

    (existingAddress.customFields || []).forEach(f =>
      mergedCustomFieldsMap.set(f.fieldId, f.fieldValue)
    );

    const newCustomFields = [{
      fieldId: FUTURE_SHIP_DATE_FIELD_ID,
      fieldValue: dateString
    }];

    newCustomFields.forEach(f =>
      mergedCustomFieldsMap.set(f.fieldId, f.fieldValue)
    );

    const mergedCustomFields = Array.from(
      mergedCustomFieldsMap,
      ([fieldId, fieldValue]) => ({ fieldId, fieldValue })
    );

    console.log('mergedCustomFields: ');
    console.log(mergedCustomFields);

    // Build FULL shipping address payload
    const updatedShippingAddress = {
      ...existingAddress,
      customFields: mergedCustomFields
    };

    const requestBody = {
        shippingAddress: updatedShippingAddress,
        lineItems: cart.lineItems.physicalItems
          .filter(i => !i.parentId && consignment.lineItemIds.includes(i.id as string))
          .map(item => ({
            itemId: item.id,
            quantity: item.quantity
          }))
      }

    // PUT updated address back
    const updateRes = await fetch(
      `/api/storefront/checkouts/${checkoutId}/consignments/${consignment.id}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    // const updateRes = await checkoutService.assignItemsToAddress(requestBody);

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`Failed to update consignment: ${err}`);
    }

    const updateResponse = await updateRes.json();
    console.log(updateResponse);

    // Force SDK to refresh its internal state
    await checkoutService.loadCheckout(checkoutId);
  }

  const saveChanges = async () => {
    setIsInProgress(true);

    // Mark this as multiple-consignment is manually assigned
    window.sessionStorage.setItem('CCC-PARAM--consignment-is-assigned-manually', '1');
    
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

    const items = mainCartItems.filter(i => consignment.lineItemIds.includes(i.item.id as string));
    
    // Delete gift product if any
    const giftItems = items.filter(i => isGiftItem(i.item));
    for(let i = 0; i < giftItems.length; i++) {
      
      console.log(`Deleting gift item: ${giftItems[i].item.id}`);

      await fetch(`/api/storefront/carts/${checkoutId}/items/${giftItems[i].item.id}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
    }

    const consignmentItems = items.filter(i => !isGiftItem(i.item)).map(i => ({ itemId: i.item.id, quantity: 1 }));

    // Move item to holding consignment
    if (holdingConsignment) {
      const requestBody = {
        address: holdingConsignment.address,
        shippingAddress: holdingConsignment.address,
        lineItems: consignmentItems,
      } as ConsignmentAssignmentRequestBody;

      await checkoutService.assignItemsToAddress(requestBody);
    } else {
      createHoldingConsignment(items.map(i => i.item));
    }

    setIsInProgress(false);
  }
  

  const getFutureShipDate = (consignment: Consignment): string  => {
    return consignment.address.customFields.find(c => c.fieldId == FUTURE_SHIP_DATE_FIELD_ID)?.fieldValue as string;
  }

  const cancelSingleAddress = () => {
    createHoldingConsignment();
    setIsShowSingleAddressConfirmation(false);

    const allItemsIds = mainCartItems.map(i => i.itemIndex);
    setSelecedItemIds(allItemsIds);
  }

  const isGiftItem = (item: PhysicalItem) => {
    return !!giftProducts.find(p => p.product_sku == item.sku);
  }

  const hasGiftItem = (consignment: Consignment) => {
    return !!mainCartItems.find(i => consignment.lineItemIds.includes(i.item.id as string) && isGiftItem(i.item));
  }

  const getGiftItem = (consignment: Consignment): CustomItem | undefined => {
    return mainCartItems.find(i => consignment.lineItemIds.includes(i.item.id as string) && isGiftItem(i.item));
  }

  return <div className="consignments-wrapper">
    <div className="step-2-title step-title">
      <span>{stepNumber}. </span>
      { isNextStep ?
        <span>Choose shipping method, future ship date, and an optional gift message for each group.</span>
      :
        <span>Select an item to add a delivery address, select & group items going to the same address.</span>
      }
    </div>

    <div className="assignment-categories">

    {consignments.length > 1 && <>

      {/* <p>Consignments: </p> */}
      
      {/* Iterate through every consignmets and filter items */}
      { consignments.filter(c => c.address.address1 !== 'TO_BE_ASSIGNED').map(c => <div key={c.id} style={{ margin: '0 10px', backgroundColor: '#c7cfc5', boxShadow: '0px 4px 4px 0px #00000026', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {mainCartItems.filter(i => !isGiftItem(i.item) && c.lineItemIds.includes(i.item.id as string))
          .map(i => <div key={i.item.id} className="item-card-wrapper">
            <ConsignmentItemCard i={i.item} unassignItem={(i) => unassignItem(i)} />
          </div>
        )}
          <div className="item-options-wrapper">
            <div className="item-options__unassign-consignment" style={{ alignItems: 'center' }}>
              <div className={`assigned-address-line ${isNextStep ? 'w-auto!' : ''} `}>
                <div className="line-1">All items in this group ship to: </div>
                <div className="line-2" style={{ color: '#fff' }}>{formatAddress(c.address)}</div>
              </div>

              {isNextStep ?
                <div className="assigned-address-line w-auto!">
                  <div className="line-1">Future Ship Date: </div>
                  <div className="line-2" style={{ color: '#fff' }}>{getFutureShipDate(c)}</div>
                </div>
              :
                <FutureShipDateOptionGroup 
                  futureShipDate={getFutureShipDate(c)} 
                  handleChangeDate={(value) => {
                    // Check if address is changed
                    if (getFutureShipDate(c) != value) {
                      updateFutureShipDate(c, value as string);
                    }
                  }} 
                  selectedConsignment={selectedConsignment} 
                  />
              }
              <div className="max-md:hidden">
                <a onClick={() => unassignConsignment(c)} style={{ textDecoration: 'underline', color: '#000' }}>Ungroup Items</a>
              </div>
            </div>
            { isNextStep &&
            <>
              <div className="item-options item-options__shipping-option-wrapper">
                <div className="bottom-options">
                  <div className="item-options__shipping-option">
                    <ShippingMethodOptionGroup 
                      handleChange={(id) => {
                        setSelectedShippingOptionIds({ ...selectedShippingOptionIds, [c.id]: id });
                      }}
                      selectedConsignment={c}
                    />
                  </div>
                  {/* <div className="item-options__ship_date">
                    {/* <input className="future-ship-date-value" placeholder="Future Ship Date" readOnly value={c.address.customFields.find(c => c.fieldId == FUTURE_SHIP_DATE_FIELD_ID)?.fieldValue} style={{ padding: '10px', fontSize: '14px' }} type="text" />
                    <FutureShipDateOptionGroup 
                      futureShipDate={getFutureShipDate(c)} 
                      handleChangeDate={(value) => {
                        // Check if address is changed
                        if (getFutureShipDate(c) != value) {
                          updateFutureShipDate(c, value as string);
                        }
                      }} 
                      selectedConsignment={selectedConsignment} 
                      />
                  </div> */}
                </div>
                <div className="item-options__gift-message flex-align-center">
                  {hasGiftItem(c) ?
                    <GiftMessageOptionGroupEdit
                      giftItem={getGiftItem(c) as CustomItem}
                      giftProducts={giftProducts}
                      selectedConsignment={c}
                      checkoutId={checkoutId}
                      setIsInProgress={setIsInProgress}
                      giftItemError={giftItemError}
                    />
                  : 
                  <GiftMessageOptionGroup 
                      giftProducts={giftProducts}
                      selectedConsignment={c}
                      checkoutId={checkoutId}
                      setIsInProgress={setIsInProgress}
                      giftItemError={giftItemError}
                    />
                  }
                </div>
              </div>
              {!c.availableShippingOptions || c.availableShippingOptions.length == 0 && <div style={{ color: '#900000', marginTop: '10px' }}>Please check your shipping address, the current address does not have validated shipping methods.</div>}
            </>
            }

            <div className="md:hidden flex justify-end mt-3">
              <a onClick={() => unassignConsignment(c)} style={{ textDecoration: 'underline', color: '#000' }}>Ungroup Items</a>
            </div>
          </div>

        </div>
      )}
    </>}

      {/* <p>Seletected Items</p> */}
      {/* Iterate through every consignmets and filter items */}
      { selecedItemIds.length > 0 &&
        <div className="assignment-category-wrapper selected-items">
          {unassignedLineItems.filter(i => selecedItemIds.includes(i.itemIndex)).map(i => <div className="item-card-wrapper" key={i.itemIndex}>
              
            <input type="checkbox" onChange={() => toggleSelectedItemId(i.itemIndex)} value={i.itemIndex} checked={selecedItemIds.includes(i.itemIndex)} />
            
            <div className="item-card">
              <ConsignmentItemCard i={i.item} />
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
              errorMessage={errorMessage}
            />

            {shippingAddressError && <p style={{ color: 'red', fontWeight: 'bold' }}>{shippingAddressError}</p>}

            {/* {(!customer || customer.isGuest) &&
              <div style={{ marginTop: '30px' }}>
                <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>CONTINUE</button>
              </div>
            } */}
          </div>}
        </div>
      }

      {/* <p>UnSeletected Items: </p> */}
      {/* Iterate through every consignmets and filter items */}
      <div className="assignment-category-wrapper un-selected-items">
        {unassignedLineItems.filter(i => !selecedItemIds.includes(i.itemIndex)).map(i => <div key={i.itemIndex} className="item-card-wrapper">
            
          <input type="checkbox" onChange={() => toggleSelectedItemId(i.itemIndex)} value={i.itemIndex} checked={selecedItemIds.includes(i.itemIndex)} />
          
          <div className="item-card">
            <ConsignmentItemCard i={i.item} />
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

      <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', justifyContent: 'right', alignItems: 'end', gap: '20px' }}>
        {unassignedLineItems.length > 0 ? <>
          <button disabled style={{ opacity: '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>NEXT STEP</button>
          <div className="desktop-only" style={{ color: '#EB2F2F', fontSize: '14px', maxWidth: '400px' }}>*Assign delivery address to all items before continuing.</div>
        </>
        :
          <>
            { !isNextStep &&
              <button onClick={() => { setIsNextStep(true) }} style={{ backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>NEXT STEP</button>
            }
            { isNextStep && !isGoTOOrderSummary ?
              <>
                <button disabled style={{ opacity: '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
                <div className="desktop-only" style={{ color: '#EB2F2F', fontSize: '16px', maxWidth: '400px' }}>** Choose Shipping Method before continuing.</div>
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

    <ConfirmDialog 
      isOpen={isShowSingleAddressConfirmation} 
      message="You have selected Ship to Multiple Addresses, but have grouped all items into a single address.  Do you want to send to a single address?  If no, then choose Ship to Multiple Addresses." 
      onConfirm={() => { setIsSingleAddress(true); }}
      onCancel={cancelSingleAddress}
      />
  </div>
}

export default MultipleConsignments;