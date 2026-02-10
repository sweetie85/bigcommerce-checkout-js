import { Consignment } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";

// import "react-datepicker/dist/react-datepicker.css";

interface FutureShipDateOptionProps {
  futureShipDate: string | null;
  handleChangeDate: (v: string | null) => void;
  selectedConsignment: Consignment | null;
}

const FutureShipDateOption = ({ futureShipDate, handleChangeDate, selectedConsignment }: FutureShipDateOptionProps) => {
  const [shouldSelectShipDate, setShouldSelectShipDate] = useState(false);
  const [shipDate, setShipDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {

    let currentFutureShipDate = futureShipDate;
    if (!currentFutureShipDate && selectedConsignment) {
      const customDateField = selectedConsignment.address.customFields.find(c => c.fieldId == 'field_26')
      if (customDateField) {
        // currentFutureShipDate = customDateField.fieldValue as string;
      }
    }

    if (currentFutureShipDate) {
      const [month, day, year] = currentFutureShipDate.split("/").map(Number);

      // Date.UTC() creates a timestamp at midnight UTC, so no timezone shift happens.
      const selectedShipDate = new Date(Date.UTC(year, month - 1, day));
      setShipDate(selectedShipDate);
      setShouldSelectShipDate(true);
    }

  }, [futureShipDate, selectedConsignment]);

   useEffect(() => {
    if (shipDate) {
      const dateString = `${shipDate.getMonth() + 1}/${shipDate.getDate()}/${shipDate.getFullYear()}`;
      handleChangeDate(dateString);
    } else {
      handleChangeDate('');
    }
  }, [shipDate]);

  const handleChange = (e: any) => {
    // console.log('e.target.value: '+e.target.value);
    if (e.target.value == '1') {
      setShouldSelectShipDate(true);
    } else {
      setShouldSelectShipDate(false);
    }
  };

  const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
  };

  return <div>
    <div className="step-title">
      <label style={{ marginLeft: '10px' }}>4. Choose a future ship date:</label>
    </div>
    <div style={{ marginLeft: '30px' }}>
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <input value="0" name="ship_date_option" onChange={handleChange} id={"future_ship_date_ship_all"} type="radio" ></input>
        <label htmlFor={"future_ship_date_ship_all"}>Ship all items right away</label>
      </div>
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <input value="1" name="ship_date_option" onChange={handleChange} id={"future_ship_date_select_date"} type="radio" ></input>
        <label htmlFor={"future_ship_date_select_date"}>Choose a future ship date</label>
      </div>

      {shouldSelectShipDate && 
        <div className="future-ship-date-wrapper" style={{ marginTop: '10px' }}>
          <DatePicker 
            selected={shipDate} 
            onChange={(date) => {
              setShipDate(date);
              setIsOpen(false); // close after select
            }} 
            filterDate={isWeekday} 
            placeholderText="Future Ship Date"
            minDate={new Date()}
            open={isOpen}
            onInputClick={() => setIsOpen(true) }
            onClickOutside={() => setIsOpen(false)}
            customInput={<input readOnly className="input-text" type="text" />}
            />
            <svg onClick={() => setIsOpen((prev) => !prev)} style={{ position: 'absolute', right: '10px', top: '12px', cursor: 'pointer' }} width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2.14483L7.02143 9L-9.37535e-08 2.14483L2.21585 -5.15101e-07L6.97857 4.70206L11.7841 -9.6858e-08L14 2.14483Z" fill="#315B42"/>
            </svg>
        </div>
      }
    </div>
  </div>
}

export default FutureShipDateOption;