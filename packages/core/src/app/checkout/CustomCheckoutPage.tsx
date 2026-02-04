
import React, { ReactNode, useEffect, useState } from "react";
import CartSummary from "./CartSummary";
import CheckoutHeader from "./CheckoutHeader";
import ShippingAndDelivery from "./shipping-n-delivery/ShippingAndDelivery";
import { CheckoutStoreSelector, Cart } from "@bigcommerce/checkout-sdk";
import OrderSummary from "./OrderSummary";
import CheckoutPayment from "./CheckoutPayment";
import { useCheckout } from "./shipping-n-delivery/CheckoutContext";

import { CheckoutPageSkeleton } from "@bigcommerce/checkout/ui";
import CheckoutFooter from "./shipping-n-delivery/CheckoutFooter";
import { CheckoutStep } from '../types';

interface CustomCheckoutPageProps {
  data: CheckoutStoreSelector;
  checkoutId: string;
  cart: Cart | undefined;
  paymentForm: ReactNode;
}

const CustomCheckoutPage = ({ data, checkoutId, cart, paymentForm  }: CustomCheckoutPageProps) => {

  const [activeTabIndex, setActiveTabIndex] = useState<CheckoutStep>(CheckoutStep.Consignment);
  const [giftProducts, setGiftProduct] = useState<{ bigcommerce_product_id: string, frontend_title: string }[]>([]);
  const { ready, checkoutState } = useCheckout();

  // Initialize data to avoid re-fetch on every component load
  useEffect(() => {

    if (!ready) {
      return;
    }

    fetch('https://phpstack-1452029-5845393.cloudwaysapps.com/bigcommerce-toms/cardproducts/list')
    .then(r => r.json())
    .then(r => {
      setGiftProduct(r.data);
    });

  }, [ready]);

   if (!ready || !checkoutState) {
    return <CheckoutPageSkeleton />;
  }

  const renderStep = (step: CheckoutStep): ReactNode => {
    switch(step) {
      case CheckoutStep.Consignment:
        return <ShippingAndDelivery checkoutId={checkoutId} gotoNextStep={() => setActiveTabIndex(CheckoutStep.OrderSummary)}  giftProducts={giftProducts} />

      case CheckoutStep.OrderSummary:
        return <OrderSummary onChangeTab={setActiveTabIndex} />

      case CheckoutStep.Payment:
        return <CheckoutPayment data={data} checkoutId={checkoutId} paymentForm={paymentForm}/>

      default:
        return null;
    }
  }

  return <section>
    <CheckoutHeader activeStep={activeTabIndex} onChangeStep={setActiveTabIndex} />
    <div className="checkout-body">
      <div className="shipping-n-delivery">
        <div className='tag-page-content' style={{ paddingBottom: '40px' }}>
          { renderStep(activeTabIndex) }
        </div>
      </div>
      <div className='cart-summary'>
        <CartSummary /> 
      </div>
    </div>
    <CheckoutFooter />
  </section>
}

export default CustomCheckoutPage;