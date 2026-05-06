import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnershipVerificationService } from './ownership-verification.service';

@ApiTags('programs')
@Controller('programs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgramsController {
  constructor(
    private readonly programsService: ProgramsService,
    private readonly ownershipService: OwnershipVerificationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new Solana program' })
  @ApiResponse({ status: 201, description: 'Program registered successfully' })
  create(@Request() req, @Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(req.user.id, createProgramDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all programs' })
  @ApiResponse({ status: 200, description: 'List of programs' })
  findAll(@Request() req) {
    return this.programsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get program by ID' })
  @ApiResponse({ status: 200, description: 'Program found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.programsService.findOne(id, req.user.id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get program statistics' })
  @ApiResponse({ status: 200, description: 'Program statistics' })
  getStats(@Param('id') id: string, @Request() req) {
    return this.programsService.getStats(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update program' })
  @ApiResponse({ status: 200, description: 'Program updated' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    return this.programsService.update(id, req.user.id, updateProgramDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete program' })
  @ApiResponse({ status: 200, description: 'Program deleted' })
  remove(@Param('id') id: string, @Request() req) {
    return this.programsService.remove(id, req.user.id);
  }

  // Ownership Verification Endpoints

  @Post(':id/ownership/generate-message')
  @ApiOperation({ summary: 'Generate ownership verification message' })
  @ApiResponse({ status: 200, description: 'Verification message generated' })
  async generateVerificationMessage(
    @Param('id') id: string,
    @Body() body: { walletAddress: string },
  ) {
    const program = await this.programsService.findOne(id);
    const message = this.ownershipService.generateVerificationMessage(
      program.programId,
      body.walletAddress,
    );
    return { message };
  }

  @Post(':id/ownership/verify')
  @ApiOperation({ summary: 'Verify program ownership' })
  @ApiResponse({ status: 200, description: 'Ownership verification result' })
  async verifyOwnership(
    @Param('id') id: string,
    @Body() body: {
      walletAddress: string;
      signature?: string;
      message?: string;
    },
  ) {
    const program = await this.programsService.findOne(id);
    const result = await this.ownershipService.verifyOwnership(
      program.programId,
      body.walletAddress,
      body.signature,
      body.message,
    );

    // If verified, update program with owner info
    if (result.isOwner) {
      await this.programsService.update(id, {
        ownerWallet: body.walletAddress,
        upgradeAuthority: result.upgradeAuthority,
        verificationMethod: result.method,
        verifiedAt: result.verifiedAt,
        verificationDetails: result.details,
      });
    }

    return result;
  }

  @Get(':id/ownership')
  @ApiOperation({ summary: 'Get program ownership information' })
  @ApiResponse({ status: 200, description: 'Program ownership info' })
  async getOwnership(@Param('id') id: string) {
    const program = await this.programsService.findOne(id);
    return {
      programId: program.programId,
      ownerWallet: program.ownerWallet,
      upgradeAuthority: program.upgradeAuthority,
      verificationMethod: program.verificationMethod,
      verifiedAt: program.verifiedAt,
      isVerified: !!program.ownerWallet,
    };
  }

  @Get(':id/upgrade-authority')
  @ApiOperation({ summary: 'Get program upgrade authority' })
  @ApiResponse({ status: 200, description: 'Program upgrade authority' })
  async getUpgradeAuthority(@Param('id') id: string) {
    const program = await this.programsService.findOne(id);
    const authority = await this.ownershipService.getUpgradeAuthority(program.programId);
    return { upgradeAuthority: authority };
  }
}
