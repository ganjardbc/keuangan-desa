import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'kaskita_rahasia_super_secure_key_123',
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role?: string;
    tenantId?: string;
    permissions?: string[];
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    return {
      ...result,
      role: user.role.name,
      permissions: payload.permissions || [],
    };
  }
}
