import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly prismaService: PrismaService,
    ) {}

    @Post()
    createUser(@Body() dto: Partial<User>) {
        return this.userService.save(dto);
    }

    @Get(':idOrEmail')
    findAll(@Param('idOrEmail') idOrEmail: string) {
        return this.userService.findOne(idOrEmail);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.userService.delete(id);
    }

    // @Get()
    // getAllTokens() {
    //     return this.prismaService.token.deleteMany();
    // }
}
