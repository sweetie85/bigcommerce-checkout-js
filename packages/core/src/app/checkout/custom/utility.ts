import { AddressRequestBody, Consignment, PhysicalItem } from "@bigcommerce/checkout-sdk";

export function formatedDate(mmddyyyy: string) {
  if (!mmddyyyy) return '';

  const [month, day, year] = mmddyyyy.split('/').map(Number);

  // IMPORTANT: local date, no UTC parsing
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function handleCheckoutError(error: any) {
  console.error(error);

  if (error?.body?.errors) {
      return Object.values(error.body.errors);
  }

  if (error?.message) {
      return [error.message];
  }

  return ['Something went wrong'];
}

export function validateAddress(address: AddressRequestBody, setErrorMessage: (msg: string | null) => void) {

  const requiredFields: Record<(keyof AddressRequestBody), string> = {
    "firstName": "Please enter First Name", 
    "lastName": "Please enter Last Name", 
    "address1": "Please enter Address",
    "city": "Please enter City",
    "countryCode": "Please select country",
    "stateOrProvince": "Please select state",
    "postalCode": "Please enter Postal Code",
    "company": '',
    "address2": '',
    'customFields': '',
    'stateOrProvinceCode': '',
    'phone': ''
  };

  let hasError = false;

  for (const [field, message] of Object.entries(requiredFields)) {
    const fieldValue = address[field as keyof AddressRequestBody] as string;
    if (message != '' && (!fieldValue || fieldValue.trim() == '')) {
      setErrorMessage(message);
      hasError = true;
      break;
    }
  }

  return !hasError;
}

export function isPast4PM_EST() {
  const date = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false
  }).formatToParts(date);

  const hourPart = parts.find(p => p.type === "hour");
  const minutePart = parts.find(p => p.type === "minute");
  if (!hourPart || !minutePart) {
    return false;
  }

  const hour = Number(hourPart.value);
  const minute = Number(minutePart.value);

  return hour > 16 || (hour === 16 && minute >= 0);
}

export function isHoldingConsignment(consignment: Consignment): boolean {
  return consignment.address.firstName == 'TO_BE_ASSIGNED' && consignment.address.address1 == '';
}

export function isIncompleteConsignment(consignment: Consignment): boolean {
  return consignment.address.firstName == 'TO_BE_ASSIGNED' && consignment.address.address1 != '';
}

export const addItemsToCart = async (checkoutId: string, gitProductId: string | null, giftMessage: string | null) => {
  
    // console.log('addItemsToCart: ');

    if (!gitProductId || !giftMessage) {
      return null;
    }

    const [productId, optionId] = gitProductId.split('|');

    const lineItems = [];
    const lineItem = {
      quantity: 1,
      productId: parseInt(productId),
      optionSelections: [{
        optionId: parseInt(optionId),
        optionValue: giftMessage
      }],
    };

    lineItems.push(lineItem);

    // console.log('lineItems: ');
    // console.log(lineItems);

    const endpoint = `/api/storefront/cart/${checkoutId}/items`;

    const payload = { lineItems };

    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Add item error:', error);
      alert('Error adding add-ons: ' + (error.title || 'Unknown error'));
      return null;
    } else {

      // console.log('Item added successfully.');
      // window.location.reload();
      // console.log(res);
      const response = await res.json();
      const physicalItems = response.lineItems.physicalItems as PhysicalItem[];
      
      const cartItems = physicalItems.filter(c => !c.parentId);;
      const lastItem = cartItems[cartItems.length - 1];

      return { itemId: lastItem.id, quantity: lastItem.quantity };
    }
  }