import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from '@auth/dto';
import { UserService } from '@user/user.service';
import { ITokens } from '@auth/interface';
import { compareSync } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@prisma/prisma.service';
import { v4 } from 'uuid';
import { add } from 'date-fns';
import { Token, User } from '@prisma/client';
import { agent } from 'supertest';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
    ) {}

    async register(dto: RegisterDto): Promise<User> {
        const user: User = await this.userService.findOne(dto.email).catch((err) => {
            this.logger.error(err);
            return err;
        });
        if (user) {
            throw new ConflictException('Пользователь с таким email уже существует');
        }

        return this.userService.save(dto).catch((err) => {
            this.logger.error(err);
            return err;
        });
    }

    async login(dto: RegisterDto, agent: string): Promise<ITokens> {
        const user: User = await this.userService.findOne(dto.email).catch((err) => {
            this.logger.error(err);
            return err;
        });

        if (!user || !compareSync(dto.password, user.password)) {
            throw new UnauthorizedException('Неверный логин или пароль');
        }

        return await this.generateTokens(user, agent);
    }

    async refreshTokens(refreshToken: string, agent: string): Promise<ITokens> {
        const token = await this.prismaService.token.findUnique({ where: { token: refreshToken } });

        if (!token) throw new UnauthorizedException();

        await this.prismaService.token.delete({ where: { token: refreshToken } });
        if (token.exp < new Date()) {
            throw new UnauthorizedException();
        }

        const user = await this.userService.findOne(token.userId);
        return this.generateTokens(user, agent);
    }

    private async generateTokens(user: User, agent: string): Promise<ITokens> {
        const accessToken =
            'Bearer ' +
            this.jwtService.sign({
                id: user.id,
                email: user.email,
                roles: user.roles,
            });
        const refreshToken = await this.getRefreshTokens(user.id, agent);
        return { accessToken, refreshToken };
    }

    private async getRefreshTokens(userId: string, agent: string): Promise<Token> {
        const _token = await this.prismaService.token.findFirst({
            where: { userId, userAgent: agent },
        });

        const token = _token?.token ?? '';

        return this.prismaService.token.upsert({
            where: { token },
            update: {
                token: v4(),
                exp: add(new Date(), { months: 1 }),
            },
            create: {
                token: v4(),
                exp: add(new Date(), { months: 1 }),
                userId,
                userAgent: agent,
            },
        });
    }
}
