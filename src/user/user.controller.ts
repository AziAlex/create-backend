import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

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
}
