import React, { useEffect, useState } from "react";

import { 
  AddressRequestBody,
  BillingAddress,
  Consignment, 
  ConsignmentAssignmentRequestBody, 
  ConsignmentLineItem, 
  CustomerAddress
} from '@bigcommerce/checkout-sdk';

import ConsignmentOption from "./options/ConsignmentOption";
import AddressOption from "./options/AddressOption";
import ShippingMethodOption from "./options/ShippingMethodOption";
import FutureShipDateOption from "./options/FutureShipDateOption";
import GiftMessageOption from "./options/GiftMessageOption";
import { useCheckout } from './CheckoutContext';
import SelectItems from "./options/SelectItems";
import { trim } from "lodash";
import FullPageLoader from "./FullPageLoader";


interface ShippingAndDeliveryProps {
  checkoutId: string;
  // shippingOptions: ShippingOption[],
  giftProducts: { bigcommerce_product_id: string, frontend_title: string }[];
  gotoNextStep: () => void
}

const ShippingAndDelivery = ({ checkoutId, giftProducts, gotoNextStep }: ShippingAndDeliveryProps) => {

  // consignment address 
  const [isSingleAddress, setIsSingleAddress] = useState(true);
  const [shouldShowNewAddress, setShouldShowNewAddress] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);

  const [isSignInActice, setIsSigninActive] = useState<boolean>(false);
  const [guestEmalId, setGuestEmailId] = useState('');
  const [guestEmalError, setGuestEmalError] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<BillingAddress | undefined>(undefined);

  // Address
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [shippingAddress, setShippingAddress] = useState<AddressRequestBody | null>(null);
  const [isInProgress, setIsInProgress] = useState(false);
  const [isUpdateAddressChecked, setIsUpdateAddressChecked] = useState(false);

  // Shipping options
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);

  // Custom message
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);

  // Future ship date
  const [futureShipDate, setFutureShipDate] = useState<string | null>(null);

  // Next page
  const [enabledNextStep, setEnabledNextStep] = useState(false);
  // const checkoutContext = useContext(CheckoutContext);
  const { checkoutState, checkoutService, hasShippingAddressEnabled, hasShippingMethodEnabled } = useCheckout();
  const customer = checkoutState.data.getCustomer();

  useEffect(() => {
    // Load Customer address
    if (customer) {
      setCustomerAddresses(customer.addresses);
    }

    console.log('customer: ');
    console.log(customer);

    const billingAddress = checkoutState.data.getBillingAddress();
    console.log('billingAddress: ');
    console.log(billingAddress);
    setBillingAddress(billingAddress);

    // Guest email id is saving as billing address email id so use billing email as guest email
    setGuestEmailId(billingAddress && billingAddress.email ? billingAddress.email : '');

    if (isSingleAddress) {
      const customerShippingAddress = checkoutState.data.getShippingAddress();
      if (customerShippingAddress) {
        console.log('isSingleAddress setShippingAddress 1: ');
        setShippingAddress(customerShippingAddress);
      }
    }

    const selectedShippingOption = checkoutState.data.getSelectedShippingOption();
    if (selectedShippingOption) {
      setSelectedShippingOptionId(selectedShippingOption.id)
    }

    // console.log('consignments: ');
    // console.log(consignments);

    // if (checkoutContext) {
      // checkoutContext.checkoutService.deleteConsignment(consignments[0].id).then((res) => {
      //   console.log('Delete consignments res:');
      //   console.log(res);
      // })
    // }

    const consignments = checkoutState.data.getConsignments();
    console.log('consignments: ');
    console.log(consignments);

    // consignments?.forEach(c => {
    //   // Delete initial consignments
    //   console.log('Delete initial consignments '+c.id)
    //   // checkoutService.deleteConsignment(c.id);

    //   checkoutService.updateConsignment({
    //     id: c.id,
    //     lineItems: []
    //   });
    // })

    if (consignments) {
      if (consignments.length == 1) {
        // Select default first consignment
        setSelectedConsignment(consignments[0]);
      } else if (consignments.length > 1) {
        setIsSingleAddress(false);
        setShippingAddress(null);

        setEnabledNextStep(true);
      }
    }
  
    console.log('checkoutState.data.getOrder()?.customerMessage: ');
    console.log(checkoutState.data.getOrder()?.customerMessage);
  }, []);

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

  const saveGuestEmail = async () => {

    const emailRegex = /^([a-zA-Z0-9_.\-])+@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    if (trim(guestEmalId).length == 0) {
      setGuestEmalError('Email address is required'); 
    } else if (!emailRegex.test(guestEmalId)) {
      setGuestEmalError('Email address is invalid'); 
    } else {
      setGuestEmalError(null);
    }

    setIsInProgress(true);

    console.log('continueAsGuest: ');
    // checkoutService.continueAsGuest()
    const res = await checkoutService.continueAsGuest({
      email: guestEmalId,
    });
    
    setIsInProgress(false);

    console.log(res);
  }

  const updateConsignments = async (giftItem: ConsignmentLineItem | null) : Promise<Consignment | null> => {

    const cart = checkoutState.data.getCart();

    if (cart) {
      const lineItems = cart.lineItems.physicalItems
        .filter(i => selectedItems.length == 0 || selectedItems.includes(i.id as string))
        .map(i => {
          return { itemId: i.id, quantity: i.quantity };
        }) as ConsignmentLineItem[];

      console.log('Gift Item:');
      console.log(giftItem);

      if (giftItem) {
        lineItems.push(giftItem);
      }

      const updatedAddress = isUpdateAddressChecked && shippingAddress ? shippingAddress : selectedConsignment?.address;
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

      // Reset future ship date after saving
      setFutureShipDate(null);
      setIsUpdateAddressChecked(false);

      if (updatedConsignments) {
        const selectedConsignment = updatedConsignments.find(c =>
          c.lineItemIds.some(id => selectedItems.includes(id))
        );

        return selectedConsignment ?? null;
      }
    }

    return null;
  }

  const saveChanges = async () => {
    setIsInProgress(true);

    console.log('saveChanges: ');
    console.log('selectedItems: ');
    console.log(selectedItems);

    const giftItem = await addItemsToCart(gitProductId, giftMessage);

    const selectedConsignment = await updateConsignments(giftItem);

    if (futureShipDate) {
      console.log('Saving future save date: ');
      checkoutService.updateCheckout({ customerMessage: futureShipDate });
    }
    
    if (selectedShippingOptionId) {
      if (selectedConsignment) {
        checkoutService.selectConsignmentShippingOption(selectedConsignment.id, selectedShippingOptionId);
      } else if (isSingleAddress) {
        checkoutService.selectShippingOption(selectedShippingOptionId);
      }
    }

    setEnabledNextStep(true);

    setIsInProgress(false);
    setSelectedItems([]);
  }

  const handleGuestEmailChange = (e: any) => {
    setGuestEmailId(e.target.value);

    const emailRegex = /^([a-zA-Z0-9_.\-])+@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

     if (trim(e.target.value).length == 0) {
      setGuestEmalError('Email address is required');
    } else {
      setGuestEmalError(null);
    }
  }

  const handleAddressChange = (updatedAddress: AddressRequestBody) => {
    console.log('setShippingAddress 2: ');
    setShippingAddress(updatedAddress); // ✅ Update single source of truth
  };

  return <div className="shipping-n-delivery">

    {isInProgress && <FullPageLoader /> }

    {(!customer || customer.isGuest) &&
      <div className="step-title">
        <label style={{}}>1. Enter the email address:</label>
        <div className="form-field-row" style={{ justifyContent: 'left', gap: '20px' }}>
          <input className="custom-form-input text" type="text" placeholder="Email Id" onChange={handleGuestEmailChange} value={guestEmalId} />
          <button onClick={saveGuestEmail} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '5px', padding: '10px'}}>Continue</button>
        </div>
        
        { guestEmalError && <div><span style={{ fontWeight: 'normal', color: '#d14343'}}>{guestEmalError}</span></div>}
        
        {isSignInActice ? <>
          <div className="form-field-row">
            <input className="custom-form-input text" type="password" placeholder="Password" onChange={handleGuestEmailChange} />
          </div>
          <div style={{ marginTop: '30px' }}>
            <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '5px', padding: '10px'}}>Sign In</button>
            <button onClick={() => setIsSigninActive(false)} style={{ color: '#315B42', marginLeft: '10px', width: '200px', textAlign: 'center', backgroundColor: '#fff', border: '1px solid #cccccc', borderRadius: '5px', padding: '10px'}}>Cancel</button>
          </div>
          </>
        : 
          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            Already have an account? <a onClick={() => window.location.href = "/login.php"} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Sign in now</a>
          </div>
        }
      </div>
    }

    { hasShippingAddressEnabled &&
      <div>
        <>
          <ConsignmentOption isSingleAddress={isSingleAddress} setIsSingleAddress={setIsSingleAddress} />
          {!isSingleAddress && <div>
            <SelectItems 
              // selecedItemIds={selectedItems} 
              // onSelectConsignment={setSelectedConsignment}
              // onChangeSelectedItems={(selectedIds) => setSelectedItems(selectedIds)}
              checkoutId={checkoutId}
            />

            {selectedItems.length > 0 &&
              <div style={{ marginTop: '20px'}}>
                <a onClick={() => setShouldShowNewAddress(true)} style={{ borderBottom: '1px solid #315B42', color: '#315B42', padding: '5px', fontWeight: 'bold' }}>Add delivery address &gt;</a>
              </div>
            }
          </div>
          }
        </> 

        {isSingleAddress &&

          <div className="" style={{ padding: '40px', backgroundColor: '#fff', marginTop: '40px'}}>
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

            {hasShippingMethodEnabled && <>
            <hr style={{ margin: '30px 0'}} />

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ width: '60%'}}>
                <ShippingMethodOption 
                  handleChange={(id) => {``
                    console.log('ShippingMethodOption id: '+id);
                    setSelectedShippingOptionId(id);
                  }} 
                  updatedShippingOptionId={selectedShippingOptionId} 
                  selectedConsignment={selectedConsignment}/>
              </div>
              <div style={{ width: '40%'}}>
                <FutureShipDateOption 
                  futureShipDate={futureShipDate} 
                  handleChangeDate={setFutureShipDate}
                  selectedConsignment={selectedConsignment}
                  />
              </div>
            </div>

            <hr style={{ margin: '30px 0'}} />      
            <GiftMessageOption 
              giftProducts={giftProducts} 
              setGiftProductId={setGiftProductId} 
              setGiftMessage={setGiftMessage} 
              selectedConsignment={selectedConsignment}
              />

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>SAVE CHANGES</button>
            </div>
            </>}
          </div>
        }
      </div>
    }

    <div style={{ textAlign: 'right', margin: '20px 0' }}>
      <button onClick={gotoNextStep} disabled={!enabledNextStep} style={{ opacity: enabledNextStep ? '1' : '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
    </div>

  </div>
}

export default ShippingAndDelivery;