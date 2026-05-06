import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateProgramDto {
  @ApiProperty({ example: 'My DeFi Protocol' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '11111111111111111111111111111111' })
  @IsString()
  @Matches(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, {
    message: 'Invalid Solana program ID format',
  })
  programId: string;

  @ApiProperty({ enum: ['MAINNET_BETA', 'DEVNET', 'TESTNET'] })
  @IsEnum(['MAINNET_BETA', 'DEVNET', 'TESTNET'])
  network: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  repositoryUrl?: string;
}
