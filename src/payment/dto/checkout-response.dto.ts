import { ApiProperty } from '@nestjs/swagger';

export class CheckoutResponseDto {
  @ApiProperty()
  paymentId: string;

  @ApiProperty({
    description: 'Stripe PaymentIntent client secret for Stripe.js',
  })
  clientSecret: string;
}
