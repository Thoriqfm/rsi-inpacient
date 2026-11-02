import prisma from "../../config/prisma.js";

export function findAkunByUsername(username) {
    return prisma.akun.findUnique({
        where: { username },
        select: {
            id_akun: true,
            username: true,
            password: true,
            role: true,
            nama_petugas: true,
        },
    });
}

export function findAkunById(id_akun) {
    return prisma.akun.findUnique({
        where: { id_akun },
        select: {
            id_akun: true,
            username: true,
            role: true,
            nama_petugas: true,
        },
    });
}

export function createAkun(data) {
    return prisma.akun.create({
        data,
        select: {
            id_akun: true,
            username: true,
            role: true,
            nama_petugas: true,
        },
    });
}
