import { useCheckout } from "../context/CheckoutContext";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { isPast4PM_EST } from "../utility";
import { Consignment } from "@bigcommerce/checkout-sdk";

type ShippingDateOption = "ship_now" | "ship_date";

interface FutureShipDateOptionProps {
  showNumbering?: boolean;
  futureShipDateError: string | null;
  handleChangeDate: (v: string | null) => void;
  setShouldSelectShipDate: (show: boolean) => void;
  selectedConsignment: Consignment | null;
}

const FutureShipDateOption = ({ 
  showNumbering = true,
  futureShipDateError, 
  handleChangeDate, 
  setShouldSelectShipDate,
  selectedConsignment,
}: FutureShipDateOptionProps) => {
  const [currentShipDate, setCurrentShipDate] = useState<Date | null>(null);
  const [newShipDate, setNewShipDate] = useState<Date | null>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  // const [shouldUserSelectShipDate, setShouldUserSelectShipDate] = useState(false);
  const [shippingDateOption, setShippingDateOption] = useState<ShippingDateOption>("ship_now");

  const { checkoutState, storeConfig } = useCheckout();
  const { futureShipDateFieldId: FUTURE_SHIP_DATE_FIELD_ID } = storeConfig;
  const consignments = checkoutState.data.getConsignments();
  const isPast4PM = isPast4PM_EST();

  const customer = checkoutState.data.getCustomer();
  const stepNumber = customer?.isGuest ? 5 : 4;

  const formatDateString = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${month}/${day}/${date.getFullYear()}`;
  };

  const parseDateString = (value: string): Date | null => {
    const parts = value.split('/').map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      return null;
    }

    let [month, day, year] = parts;

    // Backend values may contain 2-digit years (e.g. 34). Treat as 20xx for future ship dates.
    if (year < 100) {
      year += 2000;
    }

    const parsed = new Date(year, month - 1, day);

    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }

    return parsed;
  };

  useEffect(() => {
    if (consignments && selectedConsignment) {
      const customDateField = selectedConsignment.address.customFields.find(c => c.fieldId == FUTURE_SHIP_DATE_FIELD_ID)
      if (customDateField && customDateField.fieldValue && customDateField.fieldValue != '') {
        const currentFutureShipDate = customDateField.fieldValue as string;
        const currentFutureShipDateOb = parseDateString(currentFutureShipDate);
        
        setCurrentShipDate(currentFutureShipDateOb);
        setNewShipDate(currentFutureShipDateOb);

        setShippingDateOption('ship_date');
        setShouldSelectShipDate(true);
      }
    }

  }, consignments);

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateOption = e.target.value as ShippingDateOption;
    setShippingDateOption(dateOption);

    if (dateOption == 'ship_now') {
      setNewShipDate(null);
      handleChangeDate(null);
      
      setShouldSelectShipDate(false);
    } else {
      setShouldSelectShipDate(true);
    }
  };

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setNewShipDate(newDate);
      setIsOpen(false);

      const dateString = formatDateString(newDate);
      handleChangeDate(dateString);
    } else {
      handleChangeDate(null);
    }
  }

  const filterDate = (date: Date) => {
    const day = date.getDay();
    const isWeekDay = day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday

    const tomm = new Date();
    tomm.setDate(tomm.getDate() + 1);
    const isTomm = date.toDateString() === tomm.toDateString();

    // exclude weekends and if it is past 4pm EST, then it does not allow the next day. 
    // So only the following day would be an option.
    return isWeekDay && (!isTomm || !isPast4PM);
  };

  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return <div>
    <div className="step-title">
      <label className="ml-2.5">{showNumbering && <span>{stepNumber}. </span>}Choose a future ship date:</label>
    </div>
    <div className="ml-8">
      <div className="mt-2.5 flex gap-2.5">
        <input 
          value="ship_now" 
          checked={shippingDateOption === "ship_now"} 
          name="ship_date_option" 
          onChange={handleOptionChange} 
          id={"future_ship_date_ship_all"} type="radio" >
        </input>
        <label className="cursor-pointer" htmlFor={"future_ship_date_ship_all"}>Ship all items right away</label>
      </div>
      <div className="mt-2.5 flex gap-2.5">
        {/* <input value="1" checked={shouldSelectShipDate} name="ship_date_option" onChange={handleChange} id={"future_ship_date_select_date"} type="radio" ></input> */}
        <input 
          value="ship_date" 
          checked={shippingDateOption === "ship_date"} 
          name="ship_date_option" 
          onChange={handleOptionChange} 
          id={"future_ship_date_select_date"} type="radio" >
        </input>
        <label className="cursor-pointer" htmlFor={"future_ship_date_select_date"}>Choose a future ship date</label>
      </div>

      {shippingDateOption === "ship_date" && <>
        <div className="future-ship-date-wrapper mt-2.5">
          <DatePicker 
            selected={newShipDate} 
            onChange={handleDateChange} 
            filterDate={filterDate} 
            placeholderText="Future Ship Date"
            minDate={tomorrow}
            open={isOpen}
            readOnly={true}
            onInputClick={() => setIsOpen(true) }
            onClickOutside={() => setIsOpen(false)}
            onKeyDown={(e) => e.preventDefault()}
            onChangeRaw={(e) => {
              if (e) {
                e.preventDefault();
              }
            }}
            customInput={<input readOnly={true} onKeyDown={(e) => e.preventDefault()} className="input-text" type="text" />}
            />
            <svg onClick={() => setIsOpen((prev) => !prev)} className="absolute right-2.5 top-3 cursor-pointer" width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2.14483L7.02143 9L-9.37535e-08 2.14483L2.21585 -5.15101e-07L6.97857 4.70206L11.7841 -9.6858e-08L14 2.14483Z" fill="#315B42"/>
            </svg>
        </div>
          {futureShipDateError && <p className="text-red-600">{futureShipDateError}</p>}
        </>
      }
    </div>
  </div>
}

export default FutureShipDateOption;