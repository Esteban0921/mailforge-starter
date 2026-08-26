import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddSubscriberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;
}
