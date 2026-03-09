// CheckoutContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  CheckoutService,
  CheckoutSelectors,
  createCheckoutService,
  CheckoutIncludes,
} from '@bigcommerce/checkout-sdk';

// 👇 Define context shape
interface CheckoutContextValue {
  checkoutService: CheckoutService;
  checkoutState: CheckoutSelectors;
  ready: boolean;
  hasShippingAddressEnabled: boolean;
  hasShippingMethodEnabled: boolean;
  storeConfig: {
    futureShipDateFieldId: string;
  }
}

// Create context
const CheckoutContext = createContext<CheckoutContextValue | undefined>(
  undefined
);

// 👇 Provider component
interface CheckoutProviderProps {
  children: ReactNode;
}

export const CheckoutProvider: React.FC<CheckoutProviderProps> = ({
  children,
}) => {
  const [checkoutService] = useState<CheckoutService>(() =>
    createCheckoutService()
  );
  const [checkoutState, setCheckoutState] = useState<CheckoutSelectors>(
    checkoutService.getState()
  );

  const [ready, setReady] = useState(false);

  // Active Steps
  const [hasShippingAddressEnabled, setHasShippingAddressEnabled] = useState(false);
  const [hasShippingMethodEnabled, setHasShippingMethodEnabled] = useState(false);
  const [futureShipDateFieldId, setFutureShipDateFieldId] = useState('');

  useEffect(() => {
    let mounted = true;

    async function initCheckout() {
      try {

        // 1️⃣ Load main checkout
        const [checkoutState, countries] = await Promise.all([
          await checkoutService.loadCheckout(undefined, {
            params: {
              include: [
                'consignments.availableShippingOptions'
              ] as any, // FIXME: Currently the enum is not exported so it can't be used here.
            },
          }),

          // 2️⃣ Load shipping countries (important!)
          await checkoutService.loadShippingCountries()
        ]);
        // await checkoutService.loadShippingOptions();

        if (mounted) {
          // console.log('Initial Checkout state getConsignments: ');
          // console.log(checkoutState.data.getConsignments());

          setCheckoutState(checkoutState);

          const checkoutConfig = checkoutState.data.getConfig();
          if(checkoutConfig) {
            if(checkoutConfig.storeProfile.storeHash == '46licyettj') { // Staging
              setFutureShipDateFieldId('field_26');
            } else { // Production
              setFutureShipDateFieldId('field_31');
            }
          }

          setReady(true);
        }
      } catch (error) {
        console.error('Checkout initialization error:', error);
        setReady(true);
      }

      // 3️⃣ Subscribe to updates
      const unsubscribe = checkoutService.subscribe(
        (newState) => {
          // console.log('newState.data: ');
          // console.log(newState);
          const billingAddress = newState.data.getBillingAddress();
          const consignments = newState.data.getConsignments();

          if (billingAddress && billingAddress.email) {
            setHasShippingAddressEnabled(true);
          }

          if (consignments && consignments.length > 0 
            && consignments[0].address.address1 != 'TO_BE_ASSIGNED' 
            && !!consignments[0].address.postalCode) {
              
            setHasShippingMethodEnabled(true);
          }
          setCheckoutState(newState)
        },
        (newState) => ({
          billingAddress: newState.data.getBillingAddress(),
          shippingAddress: newState.data.getShippingAddress(),
          consignments: newState.data.getConsignments(),
          cart: newState.data.getCart(),
          shippingCountries: newState.data.getShippingCountries(),
        })
      );

      return unsubscribe;
    }

    const unsubscribePromise = initCheckout();

    return () => {
      mounted = false;
      unsubscribePromise.then((unsubscribe) => {
        if (typeof unsubscribe === 'function') unsubscribe();
      });
    };
  }, [checkoutService]);

  const value: CheckoutContextValue = { 
    checkoutService, 
    checkoutState, 
    ready, 
    hasShippingAddressEnabled,
    hasShippingMethodEnabled,
    storeConfig: {
      futureShipDateFieldId
    }
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

// 👇 Custom hook for accessing the context
export const useCheckout = (): CheckoutContextValue => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a <CheckoutProvider>');
  }
  return context;
};
