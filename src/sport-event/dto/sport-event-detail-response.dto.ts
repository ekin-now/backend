import { ApiProperty } from '@nestjs/swagger';
import { SportEventResponseDto } from './sport-event-response.dto';
import { SportSubEventResponseDto } from '../../sport-sub-event/dto/sport-sub-event-response.dto';
import { CompanyResponseDto } from '../../company/dto/company-response.dto';

export class SportEventDetailResponseDto extends SportEventResponseDto {
  @ApiProperty({ type: CompanyResponseDto })
  company: CompanyResponseDto;

  @ApiProperty({ type: [SportSubEventResponseDto] })
  subEvents: SportSubEventResponseDto[];
}
