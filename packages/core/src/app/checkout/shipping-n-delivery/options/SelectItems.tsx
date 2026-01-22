import { AddressRequestBody, Cart, Consignment, ConsignmentAssignmentRequestBody, ConsignmentLineItem, PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import { formatAddress } from "../../custom-utility";
import { useCheckout } from "../CheckoutContext";
import AddressOption from "./AddressOption";

interface SelectItemsProps {
  checkoutId: string;
  selecedItemIds: string[];
  onChangeSelectedItems: (ids: string[]) => void;
  onSelectConsignment: (consignment: Consignment) => void;
}

const SelectItems = ({ checkoutId, selecedItemIds, onChangeSelectedItems, onSelectConsignment }: SelectItemsProps) => {
  const [mainCartItems, setMainCartItems] = useState<PhysicalItem[]>([]);
  const [showDetailsItemIds, setShowDetailsItemIds] = useState<number[]>([]);
  
  const [isUpdateAddressChecked, setIsUpdateAddressChecked] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<AddressRequestBody | null>(null);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [holdingConsignment, setHoldingConsignment] = useState<Consignment | null>(null);
  const [unassignedLineItems, setUnassignedLineItems] = useState<PhysicalItem[]>([]);

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
      }
    }
  }, [consignments, cart]);

  const selectConsignmentByItems = (selecedItemIds: string[]) => {
    const consignments = checkoutState.data.getConsignments();

    const selectedConsignment = consignments?.find(c =>
      c.lineItemIds.some(id => selecedItemIds.includes(id))
    );

    console.log('selectConsignmentByItems: Selected Consignmet: ');
    console.log(selectedConsignment);

    if (selectedConsignment) {
      // setShippingAddress({ ...selectedConsignment.shippingAddress });
      onSelectConsignment(selectedConsignment);
    }
  }

  const createHoldingConsignment = () => {
    const PLACEHOLDER_ADDRESS = {
      countryCode: 'US',
      stateOrProvinceCode: 'CA',
      city: 'Temp',
      postalCode: '00000',
      address1: 'TO_BE_ASSIGNED',
    } as AddressRequestBody;

    if (cart) {
      checkoutService.createConsignments([{
        address: PLACEHOLDER_ADDRESS,
        lineItems: cart.lineItems.physicalItems.map(i => {
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

    onChangeSelectedItems(newSelecedItemIds);
    selectConsignmentByItems(newSelecedItemIds);
  }

  const handleAddressChange = (updatedAddress: AddressRequestBody) => {
    console.log('setShippingAddress 2: ');
    setShippingAddress(updatedAddress); // ✅ Update single source of truth
  };

  const addItemsToCart = async (gitProductId: string | null, giftMessage: string | null) => {

    console.log('addItemsToCart: ');

    if (!gitProductId || !giftMessage) {
      return null;
    }

    const [productId, optionId] = gitProductId.split('|');

    const lineItems = [];
    const lineItem = {
      quantity: 1,
      productId: parseInt(productId),
      optionSelections: [{
        optionId: parseInt(optionId),
        optionValue: giftMessage
      }],
    };

    lineItems.push(lineItem);

    console.log('lineItems: ');
    console.log(lineItems);

    const endpoint = checkoutId ? `/api/storefront/cart/${checkoutId}/items` : `/api/storefront/cart`;

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

    if (!res.ok) {
      const error = await res.json();
      console.error('Add item error:', error);
      alert('Error adding add-ons: ' + (error.title || 'Unknown error'));
      return null;
    } else {

      console.log('Item added successfully.');
      // window.location.reload();
      console.log(res);
      const response = await res.json();
      const cartItems = response.lineItems.physicalItems;
      const lastItem = cartItems[cartItems.length - 1];

      return { itemId: lastItem.id, quantity: lastItem.quantity };
    }
  }

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
    // setIsInProgress(true);

    console.log('saveChanges: ');
    console.log('selectedItems: ');
    console.log(selecedItemIds);

    const giftItem = null; //await addItemsToCart(gitProductId, giftMessage);

    const selectedConsignment = await updateConsignments(giftItem);

    // if (futureShipDate) {
    //   console.log('Saving future save date: ');
    //   checkoutService.updateCheckout({ customerMessage: futureShipDate });
    // }
    
    // if (selectedShippingOptionId) {
    //   if (selectedConsignment) {
    //     checkoutService.selectConsignmentShippingOption(selectedConsignment.id, selectedShippingOptionId);
    //   } else if (isSingleAddress) {
    //     checkoutService.selectShippingOption(selectedShippingOptionId);
    //   }
    // }

    // setEnabledNextStep(true);

    // setIsInProgress(false);
    // setSelectedItems([]);
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

        <p>Consignments: </p>
        
        {/* Iterate through every consignmets and filter items */}
        { consignments.filter(c => c.address.address1 !== 'TO_BE_ASSIGNED').map(c => <div key={c.id} style={{ margin: '0 10px', border: '1px solid #555', padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mainCartItems.filter(i => c.lineItemIds.includes(i.id as string))
            .map(i => <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              
              {/* { (consignments.length < 2 || selecedItemIds.length > 0) &&
                <input type="checkbox" value={i.id} checked={selecedItemIds.includes(i.id as string)} onChange={handleChange} />
              } */}

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
                  <div>{c.selectedShippingOption?.description}</div>
                </div>
                
                {/* <div style={{ width: '15%', marginRight: '20px' }}>
                  <div onClick={() => toggleSelectedItemId(i.id as string)} style={{ cursor: 'pointer', border: '1px solid #555', borderRadius: '8px', padding: '5px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <span style={{}}>Edit</span>
                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.1077 1.6839C11.327 1.91231 11.6176 2.16138 11.8125 2.40032C12.0261 2.66225 12.0667 2.94835 11.8862 3.24731C9.77644 5.44062 7.6541 7.6269 5.52112 9.79799C5.27568 10.0478 5.24604 10.1429 4.86458 10.1952C4.08761 10.3012 3.29163 10.3024 2.51428 10.4115C2.0272 10.3363 1.8794 10.0665 1.89802 9.58439C1.92727 8.81808 2.07279 8.02136 2.10888 7.25076C2.12028 7.13734 2.15258 7.04379 2.21185 6.9479C4.17727 4.8918 6.17233 2.86143 8.15942 0.825599C8.33761 0.643181 8.75554 0.136855 8.96185 0.0522721C9.22628 -0.0560873 9.45843 0.0105654 9.66777 0.191814C10.1473 0.605762 10.6587 1.21577 11.1074 1.68351L11.1077 1.6839ZM9.19703 1.5962L8.17955 2.65212L9.43715 3.92826L10.4554 2.86884L9.19665 1.59581L9.19703 1.5962ZM8.49338 4.91597L8.50212 4.8345L7.24832 3.58798L3.35736 7.59806L3.22553 9.02973C3.53935 9.00439 3.85242 8.96346 4.16511 8.93228C4.27682 8.92098 4.54809 8.93501 4.62902 8.88239L8.49338 4.91558V4.91597Z" fill="#315B42"/>
                      <path d="M7.57067 11.6962H0V13.0004H7.57067V11.6962Z" fill="#315B42"/>
                    </svg>
                  </div>
                </div> */}

                <div style={{ width: '40%', color: '#315B4287', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ }}>Ship to: </div>
                  <div style={{ width: '70%', textDecoration: 'underline' }}>{formatAddress(c.address)}</div>
                </div>
              </div>
            </div>
          )}
          </div>
        )}
      </>}
    </div>
  </div>
}

export default SelectItems;