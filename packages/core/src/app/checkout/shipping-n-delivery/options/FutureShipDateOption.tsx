import React from "react";

const FutureShipDateOption = () => {
  return <div>
    <div className="step-title">
      <label style={{ marginLeft: '10px' }}>4. Choose a future ship date:</label>
    </div>
    <div style={{ marginLeft: '30px' }}>
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <input name="ship_date_option" id={"future_ship_date_ship_all"} type="radio" ></input>
        <label htmlFor={"future_ship_date_ship_all"}>Ship all items right away</label>
      </div>
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <input name="ship_date_option" id={"future_ship_date_select_date"} type="radio" ></input>
        <label htmlFor={"future_ship_date_select_date"}>Choose a future ship date</label>
      </div>
    </div>
  </div>
}

export default FutureShipDateOption;