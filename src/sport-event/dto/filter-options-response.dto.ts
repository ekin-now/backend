import { ApiProperty } from '@nestjs/swagger';

export class FilterOptionsResponseDto {
  @ApiProperty({ type: [String] })
  sportTypes: string[];

  @ApiProperty({ type: [String] })
  countries: string[];

  @ApiProperty({ type: [String] })
  regions: string[];
}
