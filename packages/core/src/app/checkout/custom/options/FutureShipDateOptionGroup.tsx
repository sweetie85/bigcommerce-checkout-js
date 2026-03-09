import { Consignment } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { useCheckout } from "../context/CheckoutContext";

// import "react-datepicker/dist/react-datepicker.css";

interface FutureShipDateOptionProps {
  futureShipDate: string | null;
  handleChangeDate: (v: string | null) => void;
  selectedConsignment: Consignment | null;
}

const FutureShipDateOptionGroup = ({ futureShipDate, handleChangeDate, selectedConsignment }: FutureShipDateOptionProps) => {
  const [shipDate, setShipDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { storeConfig } = useCheckout();
  const { futureShipDateFieldId: FUTURE_SHIP_DATE_FIELD_ID } = storeConfig;
  
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

  const formatDateString = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${month}/${day}/${date.getFullYear()}`;
  };

  useEffect(() => {

    let currentFutureShipDate = futureShipDate;
    if (selectedConsignment) {
      const customDateField = selectedConsignment.address.customFields.find(c => c.fieldId == FUTURE_SHIP_DATE_FIELD_ID)
      if (customDateField) {
        currentFutureShipDate = customDateField.fieldValue as string;
        // setSelectedFutureShipDate(customDateField.fieldValue as string);
      }
    }

    if (currentFutureShipDate) {
      const selectedShipDate = parseDateString(currentFutureShipDate);

      if (selectedShipDate) {
        setShipDate(selectedShipDate);
      } else {
        setShipDate(null);
      }

      // setShouldSelectShipDate(true);
    }

  }, [futureShipDate, selectedConsignment]);

   useEffect(() => {
    if (shipDate) {
      const dateString = formatDateString(shipDate);

      if (dateString !== futureShipDate) {
        handleChangeDate(dateString);
      }
    } else {
      if (futureShipDate) {
        handleChangeDate('');
      }
    }
  }, [shipDate, futureShipDate]);

  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
  };

  return <div className="future-ship-date-wrapper">
    <DatePicker 
      selected={shipDate} 
      onChange={(date) => {
        setShipDate(date);
        setIsOpen(false); // close after select
      }} 
      filterDate={isWeekday} 
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
      customInput={<input readOnly={true} onKeyDown={(e) => e.preventDefault()} className="input-text future-ship-date-value p-2.5! rounded-none!" type="text" />}
      />
      <svg onClick={() => setIsOpen((prev) => !prev)} style={{ position: 'absolute', right: '10px', top: '20px', cursor: 'pointer' }} width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2.14483L7.02143 9L-9.37535e-08 2.14483L2.21585 -5.15101e-07L6.97857 4.70206L11.7841 -9.6858e-08L14 2.14483Z" fill="#315B42"/>
      </svg>

      {/* <svg onClick={() => {}} width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" 
        style={{ position: 'absolute', right: '-24px', top: '2px!important', cursor: 'pointer' }}>
        <path d="M12.7715 9.785L15.2615 13.55H14.7515L17.2265 9.785H19.8665L16.1765 15.185L16.0865 14.48L19.8965 20H17.1965L14.5865 16.1H15.3215L12.7415 20H10.0415L13.8065 14.48L13.8215 15.185L10.1465 9.785H12.7715Z" fill="#315B42"></path>
      </svg> */}
  </div>
}

export default FutureShipDateOptionGroup;
