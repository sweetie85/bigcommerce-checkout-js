import { AddressRequestBody } from "@bigcommerce/checkout-sdk"

const formatAddress = (address: AddressRequestBody ) => {
  return `${address.firstName} ${address.lastName} ${address.address1} ${address.address2} ${address.company} ${address.city} ${address.stateOrProvince} ${address.postalCode}`
}

export {
  formatAddress
}