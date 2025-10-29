
import React, { useState } from "react";
import CartSummary from "./CartSummary";
import CheckoutHeader from "./CheckoutHeader";
import ShippingAndDelivery from "./shipping-n-delivery/ShippingAndDelivery";
import { CheckoutStoreSelector, Cart } from "@bigcommerce/checkout-sdk";
import OrderSummary from "./OrderSummary";
import CheckoutPayment from "./CheckoutPayment";

interface CustomCheckoutPageProps {
  data: CheckoutStoreSelector;
  checkoutId: string;
  cart: Cart | undefined;
}

const CustomCheckoutPage = ({ data, checkoutId, cart  }: CustomCheckoutPageProps) => {

  const [activeTabIndex, setActiveTabIndex] = useState(0)

  return <div>
    <CheckoutHeader activeIndex={activeTabIndex} onChangeTab={setActiveTabIndex} />
    <div style={{ display: 'flex' }}>
      <div style={{ width: '75%' }} className="shipping-n-delivery">
        <div className='tag-page-content'>
          { activeTabIndex == 0 && <ShippingAndDelivery data={data} checkoutId={checkoutId} gotoNextStep={() => setActiveTabIndex(1)} /> }
          { activeTabIndex == 1 && <div className="cart-summary" style={{ background: 'none' }}>
            <OrderSummary data={data} cart={cart} />
            </div>
          }
          {activeTabIndex == 2 && <CheckoutPayment data={data} checkoutId={checkoutId}/>}
        </div>
      </div>
      <div style={{ width: '25%' }} className='cart-summary'>
          <CartSummary data={data} cart={cart} /> 
      </div>
    </div>
  </div>
}

export default CustomCheckoutPage;