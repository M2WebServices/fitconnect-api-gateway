import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { GroupService } from './services/group.service';
import { GroupRepository } from './group.repository';
import { GroupController } from './group.controller';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group]), forwardRef(() => MembershipModule)],
  controllers: [GroupController],
  providers: [GroupService, GroupRepository],
  exports: [GroupService, GroupRepository],
})
export class GroupModule {}
