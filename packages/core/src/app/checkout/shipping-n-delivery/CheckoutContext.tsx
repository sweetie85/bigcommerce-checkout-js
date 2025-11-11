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
} from '@bigcommerce/checkout-sdk';

// 👇 Define context shape
interface CheckoutContextValue {
  checkoutService: CheckoutService;
  state: CheckoutSelectors;
  ready: boolean;
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
  const [state, setState] = useState<CheckoutSelectors>(
    checkoutService.getState()
  );

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initCheckout() {
      try {
        // 1️⃣ Load main checkout
        const checkoutState = await checkoutService.loadCheckout();

        // 2️⃣ Load shipping countries (important!)
        await checkoutService.loadShippingCountries();
        await checkoutService.loadShippingOptions();

        if (mounted) {
          setState(checkoutState);
          setReady(true);
        }
      } catch (error) {
        console.error('Checkout initialization error:', error);
        setReady(true);
      }

      // 3️⃣ Subscribe to updates
      const unsubscribe = checkoutService.subscribe(
        (newState) => setState(newState),
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

  const value: CheckoutContextValue = { checkoutService, state, ready };

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
