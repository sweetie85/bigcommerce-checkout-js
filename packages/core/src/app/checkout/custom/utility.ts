import { AddressRequestBody } from "@bigcommerce/checkout-sdk";

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