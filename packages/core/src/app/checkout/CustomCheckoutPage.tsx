
import React, { ReactNode, useContext, useEffect, useState } from "react";
import CartSummary from "./CartSummary";
import CheckoutHeader from "./CheckoutHeader";
import ShippingAndDelivery from "./shipping-n-delivery/ShippingAndDelivery";
import { CheckoutStoreSelector, Cart, ShippingOption } from "@bigcommerce/checkout-sdk";
import OrderSummary from "./OrderSummary";
import CheckoutPayment from "./CheckoutPayment";
import { CheckoutContext } from "@bigcommerce/checkout/payment-integration-api";
import { useShipping } from "../shipping/hooks/useShipping";

interface CustomCheckoutPageProps {
  data: CheckoutStoreSelector;
  checkoutId: string;
  cart: Cart | undefined;
  paymentForm: ReactNode;
}

const CustomCheckoutPage = ({ data, checkoutId, cart, paymentForm  }: CustomCheckoutPageProps) => {

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [giftProducts, setGiftProduct] = useState<{ bigcommerce_product_id: string, frontend_title: string }[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  
  const checkoutContext = useContext(CheckoutContext); 
  
  const { consignments } = useShipping();

  // Initialize data to avoid re-fetch on every component load
  useEffect(() => {

    // Load shipping options
    if (checkoutContext) {
      checkoutContext.checkoutService.loadShippingOptions()
      .then((res) => {
        const shippingOptions = res.data.getShippingOptions();
        setShippingOptions(shippingOptions ? shippingOptions : []);
      });
    }

    fetch('https://phpstack-1452029-5845393.cloudwaysapps.com/bigcommerce-toms/cardproducts/list')
    .then(r => r.json())
    .then(r => {
      setGiftProduct(r.data);
    });

  }, []);


  return <div>
    <CheckoutHeader activeIndex={activeTabIndex} onChangeTab={setActiveTabIndex} />
    <div style={{ display: 'flex' }}>
      <div style={{ width: '75%' }} className="shipping-n-delivery">
        <div className='tag-page-content'>
          { activeTabIndex == 0 && <ShippingAndDelivery 
            data={data} 
            checkoutId={checkoutId} 
            gotoNextStep={() => setActiveTabIndex(1)} 
            shippingOptions={shippingOptions}
            giftProducts={giftProducts}
            /> 
          }
          { activeTabIndex == 1 && <div className="cart-summary" style={{ background: 'none' }}>
            <OrderSummary data={data} cart={cart} consignments={consignments} />
            </div>
          }
          {activeTabIndex == 2 && <CheckoutPayment data={data} checkoutId={checkoutId} paymentForm={paymentForm}/>}
        </div>
      </div>
      <div style={{ width: '25%' }} className='cart-summary'>
          <CartSummary /> 
      </div>
    </div>
  </div>
}

export default CustomCheckoutPage;