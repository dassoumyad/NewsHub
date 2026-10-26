const { transporter, mailFrom } = require("../services/nodemailer");
const OTPModel = require("../Models/otp.model");

const generateOTP = async (email) => {
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expire_otp_date = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 minutes

        const info = await transporter.sendMail({
            from: mailFrom || undefined,
            to: email,
            subject: "Your NewsHub OTP Code",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 8px;">
                    <h2 style="color: #222; margin-bottom: 10px;">Email Verification</h2>
                    <p style="color: #555; font-size: 14px; margin-bottom: 25px;">
                        Use the code below to verify your email address and complete your signup.
                    </p>

                    <div style="background: #f4f4f7; padding: 20px; text-align: center; border-radius: 6px; margin-bottom: 25px;">
                        <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #2d2d2d;">
                            ${otp}
                        </span>
                    </div>

                    <p style="color: #777; font-size: 13px;">
                        This code will expire in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.
                    </p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />

                    <p style="color: #aaa; font-size: 12px;">
                        Please don't share this code with anyone — NewsHub will never ask you for it.
                    </p>
                </div>
            `,
        });

        await OTPModel.create({ email, otp, expire_otp_date });
        console.log("OTP email sent:", info.messageId);

        return true;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return false;
    }
};

module.exports = generateOTP;
