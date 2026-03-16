import React from "react";
import { useState } from "react";
import { useCheckout } from "../context/CheckoutContext";

const CouponCodeBlock = () => {

  const [isShowPromoCode, setIsShowPromoCode] = useState<boolean>(false);
  const [couponCodeError, setCouponCodeError] = useState<string | null>(null);

  const { checkoutState, checkoutService } = useCheckout();
  const appliedCoupons = checkoutState.data.getCoupons() ?? [];

  const applyCoupon = async () => {
    setCouponCodeError(null); 

    const couponCodeInput = document.getElementById('couponCode') as HTMLInputElement;
    if (couponCodeInput) {
      const couponCode = couponCodeInput.value;

      try {
        await checkoutService.applyCoupon(couponCode);

        couponCodeInput.value = '';
        setIsShowPromoCode(false);

      } catch(e: any) {
        setCouponCodeError(e.message);  
      }
    }
  }

  const removeCoupon = async (code: string) => {
    await checkoutService.removeCoupon(code);
  }

  return <div className="custom-box-shadow bg-white p-4 mt-6 rounded-lg">
    <div>
      <label className="text-lg cursor-pointer" onClick={() => setIsShowPromoCode(!isShowPromoCode)}>Apply a Promo code</label>
    </div>

    { isShowPromoCode && <div className="mt-2 flex gap-2 items-center">
      <input id="couponCode" className="p-2 rounded" type="text"  placeholder="PROMO CODE" />
      <button className="bg-[#F6A601] rounded-lg py-2 px-5" onClick={applyCoupon}>Apply</button>
    </div>}

    {couponCodeError && <p className="text-red-500">{couponCodeError}</p> }

    <div className="mt-3 flex gap-2">
      { appliedCoupons.map((c) => <div className="flex gap-2 rounded items-center bg-gray-300 p-2">
        <span>{c.code}</span>
        <svg className="max-md:w-5 cursor-pointer" onClick={() => removeCoupon(c.code)} width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14.5" cy="14.5" r="14" fill="#D9D9D9" stroke="#315B42"></circle>
          <path d="M12.7715 9.785L15.2615 13.55H14.7515L17.2265 9.785H19.8665L16.1765 15.185L16.0865 14.48L19.8965 20H17.1965L14.5865 16.1H15.3215L12.7415 20H10.0415L13.8065 14.48L13.8215 15.185L10.1465 9.785H12.7715Z" fill="#315B42"></path>
        </svg>
      </div>) }
    </div>
  </div>
}

export default CouponCodeBlock;