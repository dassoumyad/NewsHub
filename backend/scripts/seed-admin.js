const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const AdminModel = require("../Models/admin.model");

function required(name) {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is required`);
    return value;
}

async function seedAdmin() {
    const name = required("ADMIN_NAME");
    const email = required("ADMIN_EMAIL").toLowerCase();
    const mobileNo = required("ADMIN_MOBILE");
    const password = required("ADMIN_PASSWORD");

    if (!/^\d{10}$/.test(mobileNo)) throw new Error("ADMIN_MOBILE must contain exactly 10 digits");
    if (password.length < 8) throw new Error("ADMIN_PASSWORD must contain at least 8 characters");

    await mongoose.connect(required("MONGO_URI"));
    const existingAdmin = await AdminModel.findOne({ email });
    if (existingAdmin) throw new Error("An admin with this email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    await AdminModel.create({
        name,
        email,
        mobile_no: mobileNo,
        password: hashedPassword,
        payment_details: {
            account_name: process.env.ADMIN_PAYMENT_ACCOUNT_NAME?.trim() || "",
            upi_id: process.env.ADMIN_UPI_ID?.trim() || "",
            payment_link: process.env.ADMIN_PAYMENT_LINK?.trim() || "",
        },
    });

    console.log(`Admin created: ${email}`);
}

seedAdmin()
    .catch((error) => {
        console.error(`Admin seed failed: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
