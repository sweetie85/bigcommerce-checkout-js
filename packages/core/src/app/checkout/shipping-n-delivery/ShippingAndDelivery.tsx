import React, { useContext, useEffect, useState } from "react";

import { 
  AddressRequestBody,
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
import { CheckoutContext } from "@bigcommerce/checkout/payment-integration-api";
import SelectItems from "./options/SelectItems";
import { useShipping } from "../../shipping/hooks/useShipping";
import { forEach } from "lodash";

interface ShippingAndDeliveryProps {
  data: CheckoutStoreSelector;
  checkoutId: string;
  shippingOptions: ShippingOption[],
  giftProducts: { bigcommerce_product_id: string, frontend_title: string }[];
  gotoNextStep: () => void
}

const ShippingAndDelivery = ({ data, checkoutId, shippingOptions, giftProducts, gotoNextStep }: ShippingAndDeliveryProps) => {

  // consignment address 
  const [isSingleAddress, setIsSingleAddress] = useState(true);
  const [shouldShowNewAddress, setShouldShowNewAddress] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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
  const checkoutContext = useContext(CheckoutContext);

  const { 
    cart,
    consignments
  } = useShipping();

  useEffect(() => {
    // Load Customer address
    const customer = data.getCustomer();
    if (customer) {
      setCustomerAddresses(customer.addresses);
    }

    console.log('getBillingAddress():' );
    console.log(data.getBillingAddress());

    const customerShippingAddress = data.getShippingAddress();
    if (customerShippingAddress) {
      setShippingAddress(customerShippingAddress);
    }

    const selectedShippingOption = data.getSelectedShippingOption();
    if (selectedShippingOption) {
      setSelectedShippingOptionId(selectedShippingOption.id)
    }

    console.log('consignments: ');
    console.log(consignments);

    if (checkoutContext) {
      // checkoutContext.checkoutService.deleteConsignment(consignments[0].id).then((res) => {
      //   console.log('Delete consignments res:');
      //   console.log(res);
      // })
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
      window.location.reload();
    }
  }

  const createConsignments = async () => {
    
    if (!checkoutContext) {
      return;
    }

    const lineItems = cart.lineItems.physicalItems
      .filter(i => selectedItems.includes(i.id as string))
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

    const res = await checkoutContext.checkoutService.assignItemsToAddress(requestBody);
    // const res = await checkoutContext.checkoutService.createConsignments(requestBody);
    console.log('createConsignments res: ');
    console.log(res);
  }

  const saveChanges = async () => {
    console.log('saveChanges: ');
    await addItemsToCart(gitProductId, giftMessage);

    console.log('Item added');

    if (checkoutContext) {
      if (shippingAddress) {
        // checkoutContext.checkoutService.updateShippingAddress(shippingAddress);
        // checkoutContext.checkoutService.ass
        // checkoutContext.checkoutService.assignItemsToAddress(consignments[0]);
        // console.log('Updated shipping address...');

        checkoutContext.checkoutService.updateBillingAddress(shippingAddress);
      }

      if (selectedShippingOptionId) {
        checkoutContext.checkoutService.selectShippingOption(selectedShippingOptionId);

        // Save consignment shipping option
        consignments.forEach((c) => {
          checkoutContext.checkoutService.selectConsignmentShippingOption(c.id, selectedShippingOptionId);
        });
      }

      await createConsignments();
    }

    setEnabledNextStep(true);
  }

  const handleAddressChange = (updatedAddress: AddressRequestBody) => {
    setShippingAddress(updatedAddress); // ✅ Update single source of truth
  };

  return <div className="shipping-n-delivery">
    <ConsignmentOption isSingleAddress={isSingleAddress} setIsSingleAddress={setIsSingleAddress} />

    {!isSingleAddress && <div>
      <SelectItems cart={cart} consignments={consignments} selecedItemIds={selectedItems} onChangeSelectedItems={(selectedIds) => setSelectedItems(selectedIds)} />

      <div style={{ marginTop: '20px'}}>
        <a onClick={() => setShouldShowNewAddress(true)} style={{ borderBottom: '1px solid #315B42', color: '#315B42', padding: '5px', fontWeight: 'bold' }}>Add delivery address &gt;</a>
      </div>
    </div>
    }

    <div className="" style={{ padding: '40px', backgroundColor: '#fff', marginTop: '40px', display: isSingleAddress ? 'block' : (shouldShowNewAddress ? 'block' : 'none') }}>
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