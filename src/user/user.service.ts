import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { User } from '@prisma/client';
import { genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class UserService {
    constructor(readonly prismaService: PrismaService) {}

    async save(user: Partial<User>) {
        const hashPassword = this.hashPassword(user.password);
        return this.prismaService.user.create({
            data: {
                email: user.email,
                password: hashPassword,
                roles: ['USER'],
            },
        });
    }

    async findOne(idOrEmail: string) {
        return this.prismaService.user.findFirst({
            where: {
                OR: [{ id: idOrEmail }, { email: idOrEmail }],
            },
        });
    }

    async delete(id: string) {
        return this.prismaService.user.delete({ where: { id } });
    }

    private hashPassword(password: string) {
        return hashSync(password, genSaltSync(10));
    }
}
