import React, { useState } from "react";
import DatePicker from "react-datepicker";

// import "react-datepicker/dist/react-datepicker.css";

const FutureShipDateOption = () => {
  const [shouldSelectShipDate, setShouldSelectShipDate] = useState(false);
  const [shipDate, setShipDate] = useState<Date | null>(new Date());

  const handleChange = (e: any) => {
    console.log('e.target.value: '+e.target.value);
    setShouldSelectShipDate(e.target.value == '1');
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
        <div style={{ marginTop: '10px' }}>
          <DatePicker 
            selected={shipDate} 
            onChange={(date) => setShipDate(date)} 
            filterDate={isWeekday} 
            />
        </div>
      }
    </div>
  </div>
}

export default FutureShipDateOption;