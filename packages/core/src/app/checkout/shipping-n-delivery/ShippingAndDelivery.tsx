import React, { useContext, useEffect, useState } from "react";

import { 
  AddressRequestBody,
  CheckoutStoreSelector, 
  createCheckoutService, 
  CustomerAddress,
  ShippingOption
} from '@bigcommerce/checkout-sdk';

import ConsignmentOption from "./options/ConsignmentOption";
import AddressOption from "./options/AddressOption";
import ShippingMethodOption from "./options/ShippingMethodOption";
import FutureShipDateOption from "./options/FutureShipDateOption";
import GiftMessageOption from "./options/GiftMessageOption";
import { CheckoutContext } from "@bigcommerce/checkout/payment-integration-api";

interface ShippingAndDeliveryProps {
  data: CheckoutStoreSelector;
  checkoutId: string;
  gotoNextStep: () => void
}

const ShippingAndDelivery = ({ data, checkoutId, gotoNextStep }: ShippingAndDeliveryProps) => {

  // Address
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [shippingAddress, setShippingAddress] = useState<AddressRequestBody | null>(null);

  // Shipping options
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);

  // Custom message
  const [giftProducts, setGiftProduct] = useState<{ bigcommerce_product_id: string, frontend_title: string }[]>([]);
  const [gitProductId, setGiftProductId] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);

  // Next page
  const [enabledNextStep, setEnabledNextStep] = useState(false);
  const checkoutContext = useContext(CheckoutContext);

  useEffect(() => {
    // Load Customer address
    const customer = data.getCustomer();
    if (customer) {
      setCustomerAddresses(customer.addresses);
    }

    const customerShippingAddress = data.getShippingAddress();
    if (customerShippingAddress) {
      setShippingAddress(customerShippingAddress);
    }

    // Load shipping options
    if (checkoutContext) {
      checkoutContext.checkoutService.loadShippingOptions()
      .then((res) => {
        const shippingOptions = res.data.getShippingOptions();
        setShippingOptions(shippingOptions ? shippingOptions : []);
      });
    }

    const selectedShippingOption = data.getSelectedShippingOption();
    if (selectedShippingOption) {
      setSelectedShippingOptionId(selectedShippingOption.id)
    }

    // Load card products
    fetch('https://phpstack-1452029-5845393.cloudwaysapps.com/bigcommerce-toms/cardproducts/list')
    .then(r => r.json())
    .then(r => {
      setGiftProduct(r.data);
    });

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
      window.location.reload();
    }
  }

  const saveChanges = async () => {
    console.log('saveChanges: ');
    await addItemsToCart(gitProductId, giftMessage);

    console.log('Item added');

    if (checkoutContext) {
      if (shippingAddress) {
        checkoutContext.checkoutService.updateShippingAddress(shippingAddress);
        console.log('Updated shipping address...');
      }

      if (selectedShippingOptionId) {
        checkoutContext.checkoutService.selectShippingOption(selectedShippingOptionId);
      }
    }

    setEnabledNextStep(true);
  }

  const handleAddressChange = (updatedAddress: AddressRequestBody) => {
    setShippingAddress(updatedAddress); // ✅ Update single source of truth
  };

  return <div className="shipping-n-delivery">
    <ConsignmentOption />

    <div className="" style={{ padding: '40px', backgroundColor: '#fff', marginTop: '40px' }}>
      <AddressOption 
        customerAddresses={customerAddresses} 
        shippingAddress={shippingAddress} 
        onInputChange={handleAddressChange} 
      />

      <hr style={{ margin: '30px 0'}} />

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ width: '60%'}}>
          <ShippingMethodOption 
            shippingOptions={shippingOptions} 
            handleChange={setSelectedShippingOptionId} 
            selectedShippingOptionId={selectedShippingOptionId}
          />
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

    <div style={{ textAlign: 'right', margin: '20px 0' }}>
      <button onClick={gotoNextStep} disabled={!enabledNextStep} style={{ opacity: enabledNextStep ? '1' : '0.5', backgroundColor: '#F6A601', padding: '12px 30px', borderRadius: '10px' }}>GO TO ORDER SUMMARY</button>
    </div>

  </div>
}

export default ShippingAndDelivery;