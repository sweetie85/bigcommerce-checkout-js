import { PhysicalItem } from "@bigcommerce/checkout-sdk";
import React, { useState } from "react";

interface ConsignmentItemCardProps {
  i: PhysicalItem,
  unassignItem?: (i: PhysicalItem) => void
}

const ConsignmentItemCard = ({ i, unassignItem }: ConsignmentItemCardProps) => {

  const [isShowDetails, setIsShowDetails] = useState(false);

  return <div className="consignment-item-wrapper">  
    <div className="consignment-item-details">
      
      {unassignItem &&
        <div onClick={() => unassignItem(i)} style={{ position: 'absolute', left: '-4px', top: '-4px', cursor: 'pointer' }}>
          <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14.5" cy="14.5" r="14" fill="#D9D9D9" stroke="#315B42"/>
            <path d="M12.7715 9.785L15.2615 13.55H14.7515L17.2265 9.785H19.8665L16.1765 15.185L16.0865 14.48L19.8965 20H17.1965L14.5865 16.1H15.3215L12.7415 20H10.0415L13.8065 14.48L13.8215 15.185L10.1465 9.785H12.7715Z" fill="#315B42"/>
          </svg>
        </div>
      }

      <img className="item-card__image" src={i.imageUrl} />
    
      <div style={{ marginLeft: '10px' }}>
        <div className="product-title">1 x {i.name}</div>

        {(i.options && i.options.length > 0) ?
          (isShowDetails ?
            <div>
              {i.options?.map(o => <div key={o.nameId} style={{ fontWeight: '500' }} className="product-option">{o.name} {o.value}</div>)}
              <div className="item-card__toggle-view" onClick={() => setIsShowDetails(!isShowDetails)}>View Less</div>
            </div>
            : 
            <div className="item-card__toggle-view" onClick={() => setIsShowDetails(!isShowDetails)}>View Details</div>
          )
        : <></>}
      </div>
    </div>
    <div className="product-price">
      <div>${(i.salePrice).toFixed(2)}</div>
    </div>
  </div>
}

export default ConsignmentItemCard;