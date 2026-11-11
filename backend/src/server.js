import "dotenv/config";
import app from "./app.js";
import prisma from "./config/prisma.js";

const PORT = process.env.PORT || 3001;

async function ensureDefaultAccounts() {
    try {
        const hash = "$2b$10$vu33wmureXo6LCKEnnLMs.gK2xBSVt0ORmfEH6m2x8iRkFYedbKVm"; // bcrypt for 'password123'
        const defaults = [
            {
                username: "budi.santoso",
                nama_petugas: "Budi Santoso",
                role: "Petugas Bed Management",
            },
            {
                username: "rini.aprilianti",
                nama_petugas: "Rini Aprilianti",
                role: "Petugas Administrasi",
            },
            {
                username: "admin.demo",
                nama_petugas: "Budi Santoso (Super Admin)",
                role: "Super Admin",
            },
        ];

        for (const acc of defaults) {
            const existing = await prisma.akun.findFirst({ where: { username: acc.username } });
            if (existing) {
                await prisma.akun.update({
                    where: { id_akun: existing.id_akun },
                    data: { password: hash, nama_petugas: acc.nama_petugas, role: acc.role },
                });
            } else {
                await prisma.akun.create({
                    data: {
                        username: acc.username,
                        password: hash,
                        nama_petugas: acc.nama_petugas,
                        role: acc.role,
                    },
                });
            }
        }
    } catch {
        // Silently skip if database table not yet initialized
    }
}

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at ${PORT}`);
    ensureDefaultAccounts();
});
