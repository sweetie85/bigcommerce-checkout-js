import React, { useEffect, useState } from "react";

import { 
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

interface ShippingAndDeliveryProps {
  data: CheckoutStoreSelector;
  checkoutId: string;
}

const ShippingAndDelivery = ({ data, checkoutId }: ShippingAndDeliveryProps) => {

  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [giftProducts, setGiftProduct] = useState<{ bigcommerce_product_id: string, frontend_title: string }[]>([]);

  // Sample
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([{
    id: '100',
    description: 'Free Shipping',
    cost: 0,
    additionalDescription: '',
    isRecommended: false,
    imageUrl: '',
    transitTime: '',
    type: ""
  },{
    id: '101',
    description: 'Standard',
    cost: 10.0,
    additionalDescription: '',
    isRecommended: false,
    imageUrl: '',
    transitTime: '',
    type: ""
  }]);

  useEffect(() => {
    const customer = data.getCustomer();
    if (customer) {
      setCustomerAddresses(customer.addresses);
    }
    
    console.log('data.getShippingOptions(): ');
    console.log(data.getShippingOptions());
    console.log(data.getPaymentMethods());

    
    const shippingOptions = data.getShippingOptions();
    if (shippingOptions) {
      setShippingOptions(shippingOptions);
    }

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


  return <div className="shipping-n-delivery">
    <ConsignmentOption />

    <div className="" style={{ padding: '40px', backgroundColor: '#fff', marginTop: '40px' }}>
      <AddressOption customerAddresses={customerAddresses}/>

      <hr style={{ margin: '30px 0'}} />

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ width: '60%'}}>
          <ShippingMethodOption shippingOptions={shippingOptions}/>
        </div>
        <div style={{ width: '40%'}}>
          <FutureShipDateOption />
        </div>

      </div>

      <hr style={{ margin: '30px 0'}} />      

      <GiftMessageOption giftProducts={giftProducts} handleAddItemsToCart={addItemsToCart} />

    </div>

  </div>
}

export default ShippingAndDelivery;