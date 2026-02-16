
import React, { useEffect, useState } from 'react';
import { useCheckout } from '../context/CheckoutContext';
import { CheckoutStep } from '../types';

interface CheckoutHeaderProps {
  activeStep?: CheckoutStep;
  onChangeStep: (step: CheckoutStep) => void;
}

const BackButton = () => {
  return <div className='back-to-cart'>
    <a href='/cart.php' className='back-to-cart-wrapper'>
      <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_37_106)">
          <path d="M4.20376 7.75827H13.9239L14 7.67963V5.32037L13.9239 5.24173H4.20376L7.1944 1.64309L5.44732 0L0 6.51783L5.44732 13L7.1944 11.3569L4.20376 7.75827Z" fill="#F6A601"/>
        </g>
        <defs>
        <clipPath id="clip0_37_106">
          <rect width="14" height="13" fill="white" transform="matrix(-1 0 0 1 14 0)"/>
        </clipPath>
        </defs>
      </svg>

      Return to Cart
    </a>
  </div>
}

const Logo = () => {
  return <img alt="Byrnes and Kiefer Company - Store 1 " 
    className="checkout-header-logo" 
    src="https://cdn11.bigcommerce.com/s-46licyettj/product_images/download_1755843630__87459.png">
  </img>
}

const CheckoutHeader = ({activeStep = CheckoutStep.Consignment, onChangeStep} : CheckoutHeaderProps) => {

  const [hasOrderSummaryEnabled, setHasOrderSummaryEnabled] = useState(false);

  const { checkoutState } = useCheckout();
  const consignments = checkoutState.data.getConsignments() ?? [];
  const cart = checkoutState.data.getCart();

  const verifyAndGotoStep = (step: CheckoutStep) =>  {
    if (hasOrderSummaryEnabled) {
      onChangeStep(step)
    }
  }

  useEffect(() => {

    if (cart) {

      debugger;
      
      // Check if all item as having consignment
      const userConsignments = consignments.filter(c => c.address.address1 != 'TO_BE_ASSIGNED')

      // Ensure all line items are included
      const totalItems = cart.lineItems.physicalItems.filter(i => !i.parentId).length
      const itemsInConsignments = userConsignments.reduce(
        (sum, c) => sum + c.lineItemIds.filter(i => cart.lineItems.physicalItems.find(p => p.id == i && !p.parentId)).length,
        0
      )

      const allConsignmentsHaveShipping = userConsignments.every(
        c => !!c.selectedShippingOption
      );

      if (totalItems === itemsInConsignments && allConsignmentsHaveShipping) {
        setHasOrderSummaryEnabled(true);
      } else {
        setHasOrderSummaryEnabled(false);
      }

    }
  }, [cart, consignments]);


  const nextTabStyles = (): React.CSSProperties => {
    if (hasOrderSummaryEnabled) {
      return { color: '#333', cursor: 'pointer' }
    } else {
      return { color: '#aaa', cursor: 'default' }
    }
  }

  return <><div className='mobile-only checkout-header'>
    <BackButton />
    <Logo />

    <div className='site-sub-title-text'>
      <div>THE ONLY WAY...</div>
      <div>FRESH EVERY DAY!</div>
    </div>
  </div>

  <div className='desktop-only checkout-header'>
    <BackButton />

    <div className='center-content'>
      <div>THE ONLY WAY...</div>
      <Logo />
      <div>FRESH EVERY DAY!</div>
    </div>
  </div>

  <div>
    <div className='header-tabs'>
      <div onClick={() => onChangeStep(CheckoutStep.Consignment)} style={{ borderRight: '1px solid #969696' }} className={`header-tab ${activeStep == CheckoutStep.Consignment ? 'active' : ''}`}>
        <div>
          <div className='step-number'>1</div>
        </div>
        <div className='step-title'>Delivery & Shipping</div>
      </div>
      <div onClick={() => verifyAndGotoStep(CheckoutStep.OrderSummary)} style={{ borderRight: '1px solid #969696' }} className={`header-tab ${activeStep == CheckoutStep.OrderSummary ? 'active' : ''} ${!hasOrderSummaryEnabled ? 'disabled' : '' }`}>
        <div>
          <div className='step-number'>2</div>
        </div>
        <div className='step-title'>Order Summary</div>
      </div>
      <div onClick={() => verifyAndGotoStep(CheckoutStep.Payment)} className={`header-tab ${activeStep == CheckoutStep.Payment ? 'active' : ''} ${!hasOrderSummaryEnabled ? 'disabled' : '' }`}>
        <div>
          <div className='step-number'>3</div>
        </div>
        <div className='step-title'>Payment</div>
      </div>
    </div>
  </div>
  </>
}

export default CheckoutHeader;