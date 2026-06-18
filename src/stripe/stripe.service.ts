import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe = require('stripe');

@Injectable()
export class StripeService {
  readonly client: InstanceType<typeof Stripe>;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Stripe(config.getOrThrow<string>('STRIPE_SECRET_KEY'));
    this.webhookSecret = config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
  }

  createConnectAccount(email: string, country = 'ES') {
    return this.client.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  }

  createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
    return this.client.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });
  }

  createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
    stripeAccountId?: string;
    applicationFeeAmount?: number;
  }) {
    const options: Parameters<
      InstanceType<typeof Stripe>['paymentIntents']['create']
    >[0] = {
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata ?? {},
      automatic_payment_methods: { enabled: true },
    };

    if (params.stripeAccountId) {
      options.on_behalf_of = params.stripeAccountId;
      options.transfer_data = { destination: params.stripeAccountId };
      if (params.applicationFeeAmount) {
        options.application_fee_amount = params.applicationFeeAmount;
      }
    }

    return this.client.paymentIntents.create(options);
  }

  constructWebhookEvent(payload: Buffer, signature: string) {
    return this.client.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );
  }
}
