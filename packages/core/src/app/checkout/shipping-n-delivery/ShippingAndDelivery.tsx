import React, { useContext, useEffect, useState } from "react";

import { 
  AddressRequestBody,
  BillingAddress,
  CheckoutStoreSelector, 
  ConsignmentAssignmentRequestBody, 
  ConsignmentCreateRequestBody, 
  ConsignmentLineItem, 
  createCheckoutService, 
  CustomerAddress,
  ShippingOption
} from '@bigcommerce/checkout-sdk';

import ConsignmentOption from "./options/ConsignmentOption";
import AddressOption from "./options/AddressOption";
import ShippingMethodOption from "./options/ShippingMethodOption";
import FutureShipDateOption from "./options/FutureShipDateOption";
import GiftMessageOption from "./options/GiftMessageOption";
// import { CheckoutContext } from "@bigcommerce/checkout/payment-integration-api";
import { useCheckout } from './CheckoutContext';
import SelectItems from "./options/SelectItems";
import { useShipping } from "../../shipping/hooks/useShipping";
import { useCustomer } from "../../customer/useCustomer";
import { trim } from "lodash";

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
  const [selectedConsignmentId, setSelectedConsignmentId] = useState<string | null>(null);

  const [isSignInActice, setIsSigninActive] = useState<boolean>(false);
  const [guestEmalId, setGuestEmailId] = useState('');
  const [guestEmalError, setGuestEmalError] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<BillingAddress | undefined>(undefined);

  // Address
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [shippingAddress, setShippingAddress] = useState<AddressRequestBody | null>(null);

  // Shipping options
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);

  // Custom message
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);

  // Next page
  const [enabledNextStep, setEnabledNextStep] = useState(false);
  // const checkoutContext = useContext(CheckoutContext);
  const { state: checkoutState, checkoutService } = useCheckout();
  const customer = checkoutState.data.getCustomer();

  const { 
    cart,
  } = useShipping();

  useEffect(() => {
    // Load Customer address
    if (customer) {
      setCustomerAddresses(customer.addresses);
    }

    const billingAddress = checkoutState.data.getBillingAddress();
    console.log('billingAddress: ');
    console.log(billingAddress);
    setBillingAddress(billingAddress);

    // Guest email id is saving as billing address email id so use billing email as guest email
    setGuestEmailId(billingAddress && billingAddress.email ? billingAddress.email : '');

    const customerShippingAddress = checkoutState.data.getShippingAddress();
    if (customerShippingAddress) {
      setShippingAddress(customerShippingAddress);
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
    if (consignments && consignments.length > 1) {
      setIsSingleAddress(false);
    }

  }, [])

  const addItemsToCart = async (gitProductId: string | null, giftMessage: string | null) => {

    console.log('addItemsToCart: ');

    if (!gitProductId || !giftMessage) {
      return;
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
      return;
    } else {
      console.log('Item added successfully.');
      // window.location.reload();
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

    console.log('continueAsGuest: ');
    // checkoutService.continueAsGuest()
    const res = await checkoutService.continueAsGuest({
      email: guestEmalId,
    });
    
    console.log(res);
  }

  const createConsignments = async () => {

    const lineItems = cart.lineItems.physicalItems
      .filter(i => !customer || customer.isGuest || selectedItems.includes(i.id as string))
      .map(i => {
        return { itemId: i.id, quantity: i.quantity };
      }) as ConsignmentLineItem[];

    // Test first item
    // const firstItem = cart.lineItems.physicalItems[0];
    // const lineItems = [{ itemId: firstItem.id, quantity: firstItem.quantity }];

    // const requestBody = [{
    //     address: shippingAddress,
    //     shippingAddress: shippingAddress,
    //     lineItems: lineItems
    //   }] as ConsignmentCreateRequestBody[];

    // const res = await checkoutContext.checkoutService.createConsignments(requestBody);


    const requestBody = {
        address: shippingAddress,
        shippingAddress: shippingAddress,
        lineItems: lineItems
      } as ConsignmentAssignmentRequestBody;

    const res = await checkoutService.assignItemsToAddress(requestBody);
    // const res = await checkoutContext.checkoutService.createConsignments(requestBody);
    console.log('createConsignments res: ');
    console.log(res);
  }

  const saveChanges = async () => {
    console.log('saveChanges: ');
    console.log('selectedConsignmentId: '+selectedConsignmentId);

    await addItemsToCart(gitProductId, giftMessage);

    console.log('Item added');

    if (shippingAddress) {
      // checkoutContext.checkoutService.updateShippingAddress(shippingAddress);
      // checkoutContext.checkoutService.ass
      // checkoutContext.checkoutService.assignItemsToAddress(consignments[0]);
      // console.log('Updated shipping address...');

      checkoutService.updateBillingAddress(shippingAddress);
    }

    if (selectedShippingOptionId) {
      if (isSingleAddress) {
        checkoutService.selectShippingOption(selectedShippingOptionId);
      } else if (selectedConsignmentId) {
        checkoutService.selectConsignmentShippingOption(selectedConsignmentId, selectedShippingOptionId);
      }
    }

    await createConsignments();
    

    setEnabledNextStep(true);
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
    setShippingAddress(updatedAddress); // ✅ Update single source of truth
  };

  return <div className="shipping-n-delivery">
    {(customer && customer.id) ? <>
      <ConsignmentOption isSingleAddress={isSingleAddress} setIsSingleAddress={setIsSingleAddress} />
      {!isSingleAddress && <div>
        <SelectItems 
          selecedItemIds={selectedItems} 
          onSelectConsignment={setSelectedConsignmentId}
          onChangeSelectedItems={(selectedIds) => setSelectedItems(selectedIds)} 
        />

        {selectedItems.length > 0 &&
          <div style={{ marginTop: '20px'}}>
            <a onClick={() => setShouldShowNewAddress(true)} style={{ borderBottom: '1px solid #315B42', color: '#315B42', padding: '5px', fontWeight: 'bold' }}>Add delivery address &gt;</a>
          </div>
        }
      </div>
      }
    </> 
    :
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
          <div style={{ marginTop: '20px' }}>
            Already have an account? <a onClick={() => window.location.href = "/login.php"} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Sign in now</a>
          </div>
        }
      </div>
    }

    {(isSingleAddress || selectedItems.length > 0) &&

      <div className="" style={{ padding: '40px', backgroundColor: '#fff', marginTop: '40px'}}>
        <AddressOption 
          shippingAddress={shippingAddress} 
          onInputChange={handleAddressChange} 
          selectedConsignmentId={selectedConsignmentId}
        />

        {(!customer || customer.isGuest) &&
          <div style={{ marginTop: '30px' }}>
            <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>CONTINUE</button>
          </div>
        }

        <hr style={{ margin: '30px 0'}} />

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ width: '60%'}}>
            <ShippingMethodOption handleChange={setSelectedShippingOptionId} selectedShippingOptionId={selectedShippingOptionId} />
          </div>
          <div style={{ width: '40%'}}>
            <FutureShipDateOption />
          </div>
        </div>

        <hr style={{ margin: '30px 0'}} />      
        <GiftMessageOption giftProducts={giftProducts} setGiftProductId={setGiftProductId} setGiftMessage={setGiftMessage}  />

        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <button onClick={saveChanges} style={{ width: '200px', textAlign: 'center', backgroundColor: '#315B42', color: '#fff', borderRadius: '10px', padding: '10px'}}>SAVE CHANGES</button>
        </div>
      </div>
    }

    <div style={{ textAlign: 'right', margin: '20px 0' }}>
      <button onClick={gotoNextStep} disabled={!enabledNextStep} style={{ opacity: enabledNextStep ? '1' : '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
    </div>

  </div>
}

export default ShippingAndDelivery;