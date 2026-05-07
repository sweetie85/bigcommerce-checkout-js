import { AddressRequestBody, Cart, Consignment, ConsignmentAssignmentRequestBody, ConsignmentLineItem, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { formatAddress } from "../../custom-utility";
import { useCheckout } from "../context/CheckoutContext";
import ShippingMethodOptionGroup from "../options/ShippingMethodOptionGroup";
import FutureShipDateOptionGroup from "../options/FutureShipDateOptionGroup";
import GiftMessageOptionGroup from "../options/GiftMessageOptionGroup";
import AddressOptionGroup from "../options/AddressOptionGroup";
import ConsignmentItemCard from "../components/ConsignmentItemCard";
import ConfirmDialog from "../components/ConfirmDialog";
import { GiftProduct, CustomItem } from "../types";
import GiftMessageOptionGroupEdit from "../options/GiftMessageOptionGroupEdit";
import { isHoldingConsignment, isIncompleteConsignment } from "../utility";

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
  
  const [holdingConsignment, setHoldingConsignment] = useState<Consignment | null>(null);
  const [unassignedLineItems, setUnassignedLineItems] = useState<CustomItem[]>([]);
  const [isNextStep, setIsNextStep] = useState<boolean>(false);
  const [isGoTOOrderSummary, setIsGoTOOrderSummary] = useState<boolean>(false);

  const [giftItemError, setGiftItemError] = useState<string | null>(null);
  const [isShowSingleAddressConfirmation, setIsShowSingleAddressConfirmation] = useState(false);

  const { checkoutState, checkoutService, storeConfig } = useCheckout();

  const cart: Cart | undefined = checkoutState.data.getCart();
  const consignments: Consignment[] | undefined = checkoutState.data.getConsignments() ?? [];
  const { futureShipDateFieldId: FUTURE_SHIP_DATE_FIELD_ID } = storeConfig;

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
        if (consignments.length == 0 || !isHoldingConsignment(consignments[0])) {
          // console.log('createHoldingConsignment: ');
          // Move all items to dummy consignments
          createHoldingConsignment();
        }
      }

      if (isConsignmentAssignedManually && consignments.length == 1 && !isHoldingConsignment(consignments[0])) {
        window.sessionStorage.removeItem('CCC-PARAM--consignment-is-assigned-manually');
        setIsShowSingleAddressConfirmation(true);
      }

      const holdingConsignment = consignments.find(c => isHoldingConsignment(c));
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

        setUnassignedLineItems(mainItems.filter(i => 
          !isGiftItem(i.item) && (holdingConsignment.lineItemIds.includes(i.item.id as string) || selecedItemIds.includes(i.itemIndex)))
        );

        setIsNextStep(false);
        setIsGoTOOrderSummary(false);
      } else {
        setUnassignedLineItems([]);
        // setSelecedItemIds([]);
        // setIsNextStep(true);
      }

      // const incompleteConsignments = consignments.filter(c => isIncompleteConsignment(c));
      // if (incompleteConsignments.length > 0) {
      //   // incompleteConsignments.forEach(async (c) => await unassignConsignment(c));
      //   setIncompleteConsignments(incompleteConsignments);
      // }
    }
  }, [consignments, cart, selecedItemIds]);

  // useEffect(() => {
  //   if (incompleteConsignments.length > 0) {
  //     incompleteConsignments.forEach(async (c) => await unassignConsignment(c));
  //   }
  // }, [incompleteConsignments]);

  // Verify if all consignment are assinged a shipping method
  useEffect(() => {
    const pendingShipppingMethod = consignments.find(c => !c.selectedShippingOption && !isHoldingConsignment(c) && !c.selectedShippingOption);
    const pendingShipppingMethodEdit = consignments.find(c => !isHoldingConsignment(c) && !c.selectedShippingOption);

    if (!pendingShipppingMethod && !pendingShipppingMethodEdit) {
      setIsGoTOOrderSummary(true);
    } else {
      setIsGoTOOrderSummary(false);
    }
  }, [consignments]);

  useEffect(() => {
    if (isNextStep) {
      setShowTopSteps(false);
    } else {
      setShowTopSteps(true);
    }
  }, [isNextStep]);

  const createHoldingConsignment = async (items?: PhysicalItem[]) => {
    const PLACEHOLDER_ADDRESS = {
      countryCode: 'US',
      stateOrProvinceCode: 'CA',
      city: 'Temp',
      postalCode: '00000',
      firstName: 'TO_BE_ASSIGNED',
    } as AddressRequestBody;

    if (cart) {

      // If no selected item
      if (!items) {
        // All items
        items = cart.lineItems.physicalItems.filter(c => !c.parentId);
      }

      setIsInProgress(true);

      await checkoutService.createConsignments([{
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

  const saveShippingMethod = async (consignmentId: string, shippingMethodId: string) => {
    setIsInProgress(true);
    await checkoutService.selectConsignmentShippingOption(consignmentId, shippingMethodId);
    setIsInProgress(false);
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
      {/* { isNextStep ? */}
        <span>Select an item to add a delivery address, select & group items going to the same address.</span>
        {/* <span>Choose shipping method, future ship date, and an optional gift message for each group.</span> */}
      {/* :      
      } */}
    </div>

    <div className="assignment-categories">

    {consignments.length > 1 && <>

      {/* <p>Consignments: </p> */}
      
      {/* Iterate through every consignmets and filter items */}
      { consignments.filter(c => !isHoldingConsignment(c) && !isIncompleteConsignment(c)).map(c => <div key={c.id} className="mx-2.5 bg-[#c7cfc5] rounded-lg flex flex-col gap-5" style={{ boxShadow: '0px 4px 4px 0px #00000026' }}>
        {mainCartItems.filter(i => !isGiftItem(i.item) && !selecedItemIds.includes(i.itemIndex) && c.lineItemIds.includes(i.item.id as string))
          .map(i => <div key={i.item.id} className="item-card-wrapper">
            <ConsignmentItemCard i={i.item} unassignItem={(i) => unassignItem(i)} />
          </div>
        )}
          <div className="item-options-wrapper">
            <div className="item-options__unassign-consignment items-center">
              <div className={`assigned-address-line ${isNextStep ? 'w-auto!' : ''} `}>
                <div className="line-1">All items in this group ship to: </div>
                <div className="line-2 text-white">{formatAddress(c.address)}</div>
              </div>

              {/* {isNextStep ?
                <div className="assigned-address-line w-auto!">
                  <div className="line-1">Future Ship Date: </div>
                  <div className="line-2">{getFutureShipDate(c)}</div>
                </div>
              : */}
                <FutureShipDateOptionGroup 
                  futureShipDate={getFutureShipDate(c)} 
                  handleChangeDate={(value) => {

                    // Check if address is changed
                    if (getFutureShipDate(c) != value) {
                      updateFutureShipDate(c, value as string);
                    }
                  }} 
                  selectedConsignment={c} 
                  />
              {/* } */}
              <div className="max-md:hidden">
                <a onClick={() => unassignConsignment(c)} className="underline text-black!">Ungroup Items</a>
              </div>
            </div>
            
            <>
              <div className="item-options item-options__shipping-option-wrapper">
                <div className="bottom-options">
                  <div className="item-options__shipping-option">
                    <ShippingMethodOptionGroup 
                      handleChange={(id) => {
                        saveShippingMethod(c.id, id);
                      }}
                      selectedConsignment={c}
                    />
                  </div>
                  {/* <div className="item-options__ship_date">
                    {/* <input className="future-ship-date-value" placeholder="Future Ship Date" readOnly value={c.address.customFields.find(c => c.fieldId == FUTURE_SHIP_DATE_FIELD_ID)?.fieldValue} type="text" />
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
              {!c.availableShippingOptions || c.availableShippingOptions.length == 0 && <div className="text-[#900000] mt-2.5">Please check your shipping address, the current address does not have validated shipping methods.</div>}
            </>

            <div className="md:hidden flex justify-end mt-3">
              <a onClick={() => unassignConsignment(c)} className="underline text-black!">Ungroup Items</a>
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
              checkoutId={checkoutId}
              giftProducts={giftProducts}
              selectedLineItems={mainCartItems.filter(i => selecedItemIds.length == 0 || selecedItemIds.includes(i.itemIndex))}
              setIsInProgress={setIsInProgress}
              onComplete={() => setSelecedItemIds([])}              
            />
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

      <div></div>
      <div className="my-5 flex flex-col justify-end items-end gap-5">
        {unassignedLineItems.length > 0 ? <>
          <button disabled className="opacity-50 bg-[#F6A601] py-3 px-7.5" style={{ borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
          <div className="desktop-only" style={{ color: '#EB2F2F', fontSize: '14px', maxWidth: '400px' }}>*Assign delivery address to all items before continuing.</div>
        </>
        :
          <>
            { !isGoTOOrderSummary ?
              <>
                <button disabled style={{ opacity: '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
                <div className="desktop-only" style={{ color: '#EB2F2F', fontSize: '16px', maxWidth: '400px' }}>** Choose Shipping Method before continuing.</div>
              </>
            :
              <button onClick={gotoNextStep} style={{ backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
            }
          </>
        }
        
      </div>
    </div>

    <div className="mobile-only" style={{ display: 'flex', justifyContent: 'right' }}>
      {unassignedLineItems.length > 0 &&
        <div className="mobile-only" style={{ color: '#EB2F2F', fontSize: '14px', maxWidth: '250px' }}>*Assign delivery address to all items before continuing.</div>
      }

      {/* { (!isGoTOOrderSummary) &&
        <div className="mobile-only" style={{ color: '#EB2F2F', fontSize: '14px', maxWidth: '250px' }}>**Choose shipping method and date for all groups before continuing.</div>
      } */}

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