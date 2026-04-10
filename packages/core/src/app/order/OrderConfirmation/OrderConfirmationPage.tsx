import {
    type Order,
    type ShopperConfig,
    type ShopperCurrency,
    type StoreConfig,
    type StoreCurrency,
} from '@bigcommerce/checkout-sdk';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import React, { useEffect, type ReactElement } from 'react';

import { ErrorModal } from '../../common/error';
import { getPasswordRequirementsFromConfig } from '../../customer';
import { isEmbedded } from '../../embeddedCheckout';
import {
    GuestSignUpForm,
    PasswordSavedSuccessAlert,
    SignedUpSuccessAlert,
    type SignUpFormValues,
} from '../../guestSignup';
import OrderConfirmationSection from '../OrderConfirmationSection';
import OrderStatus from '../OrderStatus';
import ThankYouHeader from '../ThankYouHeader';

import { ContinueButton } from './ContinueButton';
import { OrderSummaryContainer } from './OrderSummaryContainer';

interface OrderConfirmationPageProps {
    order: Order;
    config: StoreConfig;
    supportEmail: string;
    supportPhoneNumber: string | undefined;
    paymentInstructions: string | undefined;
    shouldShowPasswordForm: boolean;
    hasSignedUp: boolean | undefined;
    isSigningUp: boolean | undefined;
    onSignUp(values: SignUpFormValues): void;
    shopperConfig: ShopperConfig;
    customerCanBeCreated: boolean;
    siteLink: string;
    currency: StoreCurrency;
    shopperCurrency: ShopperCurrency;
    isShippingDiscountDisplayEnabled: boolean;
    error: Error | undefined;
    onErrorModalClose(): void;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

type GoogleAdsConversion = {
  send_to: string;
  value: number;
  currency: string;
  transaction_id?: string;
};

export const OrderConfirmationPage = ({
    config,
    currency,
    customerCanBeCreated,
    error,
    hasSignedUp,
    isShippingDiscountDisplayEnabled,
    isSigningUp,
    onErrorModalClose,
    onSignUp,
    order,
    paymentInstructions,
    shopperConfig,
    shopperCurrency,
    shouldShowPasswordForm,
    siteLink,
    supportEmail,
    supportPhoneNumber,
}: OrderConfirmationPageProps): ReactElement => {

    useEffect(() => {
        console.log('Order confirmation: ');
        console.log(order);

        const saveOrderPaymentLog = async () => {
            await fetch('https://custom-app.carolinacookie.com/bigcommerce-toms/api/checkout/save-payment-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                keepalive: true, // 🔥 important
                body: JSON.stringify({
                    order_id: order.orderId,
                    payment_details: order.payments,
                }),
            });
        }

        saveOrderPaymentLog()
    }, []);

    useEffect(() => {

        if (!window.gtag || !order) return;

        const conversionData = {
            send_to: 'AW-319189248/0RrqCP-FvIgYEIDimZgB',
            value: order.orderAmount,
            currency: order.currency?.code || 'USD',
            transaction_id: order.orderId?.toString(),
        } as GoogleAdsConversion;

        console.log('Adding gtag: ');
        console.log(conversionData);

        window.gtag('event', 'conversion', conversionData);
    }, [order]);

    return <div
        className={classNames('layout optimizedCheckout-contentPrimary custom-checkout', {
            'is-embedded': isEmbedded(),
        })}
    >
        <div className="layout-main">
            <div className="orderConfirmation">
                <ThankYouHeader name={order.billingAddress.firstName} />
                <OrderStatus
                    config={config}
                    order={order}
                    supportEmail={supportEmail}
                    supportPhoneNumber={supportPhoneNumber}
                />
                {paymentInstructions && (
                    <OrderConfirmationSection>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(paymentInstructions),
                            }}
                            data-test="payment-instructions"
                        />
                    </OrderConfirmationSection>
                )}

                {shouldShowPasswordForm && !hasSignedUp && (
                    <GuestSignUpForm
                        customerCanBeCreated={customerCanBeCreated}
                        isSigningUp={isSigningUp}
                        onSignUp={onSignUp}
                        passwordRequirements={getPasswordRequirementsFromConfig(shopperConfig)}
                    />
                )}

                {hasSignedUp &&
                    (order?.customerId ? (
                        <PasswordSavedSuccessAlert />
                    ) : (
                        <SignedUpSuccessAlert />
                    ))}

                <ContinueButton siteLink={siteLink} />
            </div>
        </div>

        <OrderSummaryContainer
            currency={currency}
            isShippingDiscountDisplayEnabled={isShippingDiscountDisplayEnabled}
            order={order}
            shopperCurrency={shopperCurrency}
        />

        <ErrorModal error={error} onClose={onErrorModalClose} shouldShowErrorCode={false} />
    </div>
}

