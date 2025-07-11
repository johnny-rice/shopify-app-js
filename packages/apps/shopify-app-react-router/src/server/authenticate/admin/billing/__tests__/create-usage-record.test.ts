import {
  BillingConfigSubscriptionLineItemPlan,
  BillingInterval,
  HttpResponseError,
} from '@shopify/shopify-api';

import {shopifyApp} from '../../../..';
import {
  APP_URL,
  BASE64_HOST,
  GRAPHQL_URL,
  TEST_SHOP,
  getJwt,
  getThrownResponse,
  setUpValidSession,
  testConfig,
  mockExternalRequests,
  mockExternalRequest,
} from '../../../../__test-helpers';
import {REAUTH_URL_HEADER} from '../../../const';

import * as responses from './mock-responses';

const BILLING_CONFIG = {
  [responses.PLAN_1]: {
    lineItems: [
      {
        amount: 5,
        currencyCode: 'USD',
        terms: '1 dollar per usage',
        interval: BillingInterval.Usage,
      },
    ],
  } as BillingConfigSubscriptionLineItemPlan,
};

describe('Create usage record', () => {
  it('returns a usage record when one was created successfully', async () => {
    // GIVEN
    const shopify = shopifyApp(testConfig({billing: BILLING_CONFIG}));
    await setUpValidSession(shopify.sessionStorage);

    const {billing} = await shopify.authenticate.admin(
      new Request(`${APP_URL}/billing`, {
        headers: {Authorization: `Bearer ${getJwt().token}`},
      }),
    );

    await mockExternalRequest({
      request: new Request(GRAPHQL_URL, {
        method: 'POST',
        body: 'appUsageRecordCreate',
      }),
      response: new Response(responses.USAGE_RECORD_CREATE_RESPONSE),
    });

    // WHEN
    const subscription = await billing.createUsageRecord({
      subscriptionLineItemId: responses.USAGE_RECORD_SUBSCRIPTION_ID,
      isTest: true,
      price: responses.USAGE_RECORD_PRICE,
      description: responses.USAGE_RECORD_DESCRIPTION,
    });

    // THEN
    expect(subscription).toEqual(responses.USAGE_RECORD);
  });

  it('returns a usage record when no subscription id is not passed', async () => {
    // GIVEN
    const shopify = shopifyApp(testConfig({billing: BILLING_CONFIG}));
    await setUpValidSession(shopify.sessionStorage);

    const {billing} = await shopify.authenticate.admin(
      new Request(`${APP_URL}/billing`, {
        headers: {Authorization: `Bearer ${getJwt().token}`},
      }),
    );

    await mockExternalRequests(
      {
        request: new Request(GRAPHQL_URL, {
          method: 'POST',
          body: 'appSubscription',
        }),
        response: new Response(
          responses.SUBSCRIPTIONS_WITH_USAGE_PLANS_RESPONSE,
        ),
      },
      {
        request: new Request(GRAPHQL_URL, {
          method: 'POST',
          body: 'appUsageRecordCreate',
        }),
        response: new Response(responses.USAGE_RECORD_CREATE_RESPONSE),
      },
    );
    // WHEN
    const subscription = await billing.createUsageRecord({
      isTest: true,
      price: responses.USAGE_RECORD_PRICE,
      description: responses.USAGE_RECORD_DESCRIPTION,
    });

    // THEN
    expect(subscription).toEqual(responses.USAGE_RECORD);
  });

  it('redirects to exit-iframe with authentication using app bridge when Shopify invalidated the session', async () => {
    // GIVEN
    const config = testConfig();
    const shopify = shopifyApp({...config, billing: BILLING_CONFIG});
    await setUpValidSession(shopify.sessionStorage);

    const {token} = getJwt();
    const request = new Request(
      `${APP_URL}/billing?embedded=1&shop=${TEST_SHOP}&host=${BASE64_HOST}&id_token=${token}`,
    );

    const {billing} = await shopify.authenticate.admin(request);

    await mockExternalRequest({
      request: new Request(GRAPHQL_URL, {
        method: 'POST',
        body: 'appUsageRecordCreate',
      }),
      response: new Response(undefined, {
        status: 401,
        statusText: 'Unauthorized',
      }),
    });

    // WHEN
    const response = await getThrownResponse(
      async () =>
        billing.createUsageRecord({
          subscriptionLineItemId: '123',
          price: {
            amount: 5,
            currencyCode: 'USD',
          },
          description: 'A usage record',
          isTest: true,
        }),
      request,
    );

    // THEN
    const shopSession = await config.sessionStorage.loadSession(
      `offline_${TEST_SHOP}`,
    );
    expect(shopSession).toBeDefined();
    expect(shopSession!.accessToken).toBeUndefined();

    // Expect Token Exchange behavior: redirect to session-token path
    expect(response.status).toBe(302);
    const {pathname} = new URL(response.headers.get('location')!, APP_URL);
    expect(pathname).toBe('/auth/session-token');
  });

  it('returns redirection headers during fetch requests when Shopify invalidated the session', async () => {
    // GIVEN
    const shopify = shopifyApp(testConfig({billing: BILLING_CONFIG}));
    await setUpValidSession(shopify.sessionStorage);

    const request = new Request(`${APP_URL}/billing`, {
      headers: {
        Authorization: `Bearer ${getJwt().token}`,
      },
    });

    const {billing} = await shopify.authenticate.admin(request);

    await mockExternalRequest({
      request: new Request(GRAPHQL_URL, {
        method: 'POST',
        body: 'appUsageRecordCreate',
      }),
      response: new Response(undefined, {
        status: 401,
        statusText: 'Unauthorized',
      }),
    });

    // WHEN
    const response = await getThrownResponse(
      async () =>
        billing.createUsageRecord({
          subscriptionLineItemId: '123',
          price: {
            amount: 5,
            currencyCode: 'USD',
          },
          description: 'A usage record',
          isTest: true,
        }),
      request,
    );

    // THEN
    expect(response.status).toEqual(401);

    // Expect Token Exchange behavior: retry header instead of reauth URL
    expect(
      response.headers.get('X-Shopify-Retry-Invalid-Session-Request'),
    ).toEqual('1');
    expect(response.headers.get(REAUTH_URL_HEADER)).toBeNull();
  });

  it('throws errors other than authentication errors', async () => {
    // GIVEN
    const shopify = shopifyApp(testConfig({billing: BILLING_CONFIG}));
    await setUpValidSession(shopify.sessionStorage);

    await mockExternalRequest({
      request: new Request(GRAPHQL_URL, {
        method: 'POST',
        body: 'appUsageRecordCreate',
      }),
      response: new Response(undefined, {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    });

    const request = new Request(`${APP_URL}/billing`, {
      headers: {
        Authorization: `Bearer ${getJwt().token}`,
      },
    });

    const {billing} = await shopify.authenticate.admin(request);

    // THEN
    await expect(
      billing.createUsageRecord({
        subscriptionLineItemId: '123',
        isTest: true,
        price: {
          amount: 5,
          currencyCode: 'USD',
        },
        description: 'A usage record',
      }),
    ).rejects.toThrowError(HttpResponseError);
  });
});
