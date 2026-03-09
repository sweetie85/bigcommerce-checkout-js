
import React, { ReactNode, useEffect, useState } from "react";
import CartSummary from "./sections/CartSummary";
import CheckoutHeader from "./sections/CheckoutHeader";
import ShippingAndDelivery from "./sections/ShippingAndDelivery";
import { CheckoutStoreSelector, Cart } from "@bigcommerce/checkout-sdk";
import OrderSummary from "./sections/OrderSummary";
import CheckoutPayment from "./sections/CheckoutPayment";
import { useCheckout } from "./context/CheckoutContext";

import { CheckoutPageSkeleton } from "@bigcommerce/checkout/ui";
import CheckoutFooter from "./sections/CheckoutFooter";
import { CheckoutStep, GiftProduct } from './types';

interface CustomCheckoutPageProps {
  data: CheckoutStoreSelector;
  checkoutId: string;
  cart: Cart | undefined;
  paymentForm: ReactNode;
}

const CheckoutPage = ({ checkoutId, paymentForm  }: CustomCheckoutPageProps) => {

  const [activeTabIndex, setActiveTabIndex] = useState<CheckoutStep>(CheckoutStep.Consignment);
  const [giftProducts, setGiftProduct] = useState<GiftProduct[]>([]);
  const { ready, checkoutState, storeConfig } = useCheckout();

  // Initialize data to avoid re-fetch on every component load
  useEffect(() => {

    if (!ready) {
      return;
    }

    const API_BASE_URL = (storeConfig.environment == 'LIVE') ? 'https://custom-app.carolinacookie.com/bigcommerce-toms' : 'https://phpstack-1452029-5845393.cloudwaysapps.com/bigcommerce-toms';

    fetch(`${API_BASE_URL}/cardproducts/list`).then(r => r.json())
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
        return <CheckoutPayment checkoutId={checkoutId} paymentForm={paymentForm}/>

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

export default CheckoutPage;