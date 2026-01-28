import { Consignment } from "@bigcommerce/checkout-sdk";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";

// import "react-datepicker/dist/react-datepicker.css";

interface FutureShipDateOptionProps {
  futureShipDate: string | null;
  handleChangeDate: (v: string | null) => void;
  selectedConsignment: Consignment | null;
}

const FutureShipDateOptionGroup = ({ futureShipDate, handleChangeDate, selectedConsignment }: FutureShipDateOptionProps) => {
  const [shouldSelectShipDate, setShouldSelectShipDate] = useState(false);
  const [shipDate, setShipDate] = useState<Date | null>(null);
  const [selectedFutureShipDate, setSelectedFutureShipDate] = useState<string | null>(null);

  useEffect(() => {

    let currentFutureShipDate = futureShipDate;
    if (selectedConsignment) {
      const customDateField = selectedConsignment.address.customFields.find(c => c.fieldId == 'field_26')
      if (customDateField) {
        currentFutureShipDate = customDateField.fieldValue as string;
        // setSelectedFutureShipDate(customDateField.fieldValue as string);
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
    console.log('e.target.value: '+e.target.value);
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

  return <div style={{ position: 'relative', width: '500px' }}>
    <DatePicker 
      selected={shipDate} 
      onChange={(date) => setShipDate(date)} 
      filterDate={isWeekday} 
      placeholderText="Future Ship Date"
      customInput={<input style={{ width: '500px', padding: '10px', fontSize: '14px' }} type="text" />}
      />
      <svg style={{ position: 'absolute', right: '10px', top: '16px' }} width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2.14483L7.02143 9L-9.37535e-08 2.14483L2.21585 -5.15101e-07L6.97857 4.70206L11.7841 -9.6858e-08L14 2.14483Z" fill="#315B42"/>
      </svg>
  </div>
}

export default FutureShipDateOptionGroup;