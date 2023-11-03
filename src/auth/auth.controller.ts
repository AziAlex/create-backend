import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpStatus,
    Post,
    Req,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '@auth/dto';
import { ITokens } from '@auth/interface';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Cookie, UserAgent } from '@common/decorators';

const REFRESH_TOKEN = 'refreshToken';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        const user = await this.authService.register(dto);

        if (!user) {
            throw new BadRequestException(
                'Не получается зарегистрирувать пользователя с этим email',
            );
        }
    }

    @Post('login')
    async login(@Body() dto: RegisterDto, @Res() res: Response, @UserAgent() agent: string) {
        let tokens = await this.authService.login(dto, agent);

        if (!tokens) throw new BadRequestException('Логин или пароль не совпадают');

        this.setRefreshTokenToCookie(tokens, res);
    }

    @Get('refresh-tokens')
    async refreshTokens(
        @Cookie(REFRESH_TOKEN) refreshToken: string,
        @Res() res: Response,
        @UserAgent() agent: string,
    ) {
        if (typeof refreshToken !== 'string') throw new UnauthorizedException();

        const tokens = await this.authService.refreshTokens(refreshToken, agent);

        if (!tokens) throw new UnauthorizedException();

        this.setRefreshTokenToCookie(tokens, res);
    }

    private setRefreshTokenToCookie(tokens: ITokens, res: Response) {
        if (!tokens) throw new UnauthorizedException();

        res.cookie(REFRESH_TOKEN, tokens.refreshToken.token, {
            httpOnly: true,
            sameSite: 'lax',
            expires: new Date(tokens.refreshToken.exp),
            secure: this.configService.get('NODE_ENV', 'development') === 'production',
            path: '/',
        });
        res.status(HttpStatus.CREATED).json({
            accessToken: tokens.accessToken,
        });
    }
}
