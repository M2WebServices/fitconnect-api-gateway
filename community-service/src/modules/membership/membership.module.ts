import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './membership.entity';
import { MembershipService } from './services/membership.service';
import { MembershipRepository } from './membership.repository';
import { MembershipController } from './membership.controller';
import { UserModule } from '../user/user.module';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [TypeOrmModule.forFeature([Membership]), UserModule, GroupModule],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipRepository],
  exports: [MembershipService, MembershipRepository],
})
export class MembershipModule {}
