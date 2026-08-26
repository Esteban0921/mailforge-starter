import { IsNotEmpty, IsString } from 'class-validator';

export class ImportSubscribersDto {
  @IsString()
  @IsNotEmpty()
  csvText!: string;
}
