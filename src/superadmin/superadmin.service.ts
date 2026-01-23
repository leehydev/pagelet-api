import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AccountStatus } from '../auth/entities/user.entity';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { WaitlistUserResponseDto } from './dto/waitlist-user-response.dto';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 대기자 목록 조회 (PENDING 상태 사용자)
   */
  async getWaitlist(): Promise<WaitlistUserResponseDto[]> {
    const users = await this.userRepository.find({
      where: { accountStatus: AccountStatus.PENDING },
      order: { createdAt: 'ASC' },
      select: ['id', 'email', 'name', 'createdAt'],
    });

    return users.map(
      (user) =>
        new WaitlistUserResponseDto({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        }),
    );
  }

  /**
   * 대기자 승인 (PENDING -> ACTIVE)
   */
  async approveUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw BusinessException.fromErrorCode(ErrorCode.USER_NOT_FOUND);
    }

    if (user.accountStatus !== AccountStatus.PENDING) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'User is not in pending status',
      );
    }

    user.accountStatus = AccountStatus.ACTIVE;
    await this.userRepository.save(user);
    this.logger.log(`User ${userId} approved and activated`);
  }
}
