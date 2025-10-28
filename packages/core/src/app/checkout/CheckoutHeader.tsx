
import React from 'react';

interface CheckoutHeaderProps {
  activeIndex?: number
  onChangeTab: (index: number) => void;
}

const CheckoutHeader = ({activeIndex = 0, onChangeTab} : CheckoutHeaderProps) => {
  return <><div className='checkout-header test-lalmani'>
    <div className='back-to-cart'>
      <a href='/cart.php' style={{ color: 'inherit', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_37_106)">
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
    <div className='center-content'>
      <div>THE ONLY WAY...</div>
      <img alt="Byrnes and Kiefer Company - Store 1 " 
        className="checkout-header-logo" 
        src="https://cdn11.bigcommerce.com/s-46licyettj/product_images/download_1755843630__87459.png">
      </img>
      <div>FRESH EVERY DAY!</div>
    </div>
  </div>
  <div>
    <div className='header-tabs'>
      <div onClick={() => onChangeTab(0)} className={`header-tab ${activeIndex == 0 ? 'active' : ''}`}>
        <div className='step-number'>1</div>
        <div className='step-title'>Shipping & Delivery</div>
      </div>
      <div onClick={() => onChangeTab(1)} className={`header-tab ${activeIndex == 1 ? 'active' : ''}`}>
        <div className='step-number'>2</div>
        <div className='step-title'>Order Summary</div>
      </div>
      <div onClick={() => onChangeTab(2)} className={`header-tab ${activeIndex == 2 ? 'active' : ''}`}>
        <div className='step-number'>3</div>
        <div className='step-title'>Payment</div>
      </div>
    </div>
  </div>
  </>
}

export default CheckoutHeader;