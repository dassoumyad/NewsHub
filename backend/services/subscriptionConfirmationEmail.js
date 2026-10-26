const { transporter, mailFrom } = require("./nodemailer");

const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatDate = (value) => new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
}).format(new Date(value));

async function sendSubscriptionConfirmationEmail(user, subscription) {
    if (!mailFrom) {
        console.warn("Subscription confirmation email skipped: SMTP sender is not configured.");
        return false;
    }

    const name = escapeHtml(user.name || "NewsHub reader");
    const amount = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(subscription.amount);
    const startDate = formatDate(subscription.subscription_start_date);
    const endDate = formatDate(subscription.subscription_end_date);
    const paymentId = escapeHtml(subscription.razorpay_payment_id);

    try {
        await transporter.sendMail({
            from: mailFrom,
            to: user.email,
            subject: "Your NewsHub Premium subscription is active",
            text: `Hi ${user.name || "there"}, your NewsHub Premium subscription is active. Amount: ${amount}. Access: ${startDate} to ${endDate}. Payment reference: ${subscription.razorpay_payment_id}.`,
            html: `
                <div style="margin:0;background:#f8f6f2;padding:32px 16px;font-family:Arial,sans-serif;color:#2e2929">
                    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eee7e3">
                        <div style="background:#6f1022;padding:24px 30px;color:#ffffff">
                            <div style="font-size:22px;font-weight:700;letter-spacing:-1px">news<span style="font-weight:400">hub</span><span style="color:#efb8c0">.</span></div>
                            <div style="margin-top:8px;color:#f2d9dd;font-size:11px;letter-spacing:2px">PREMIUM MEMBERSHIP</div>
                        </div>
                        <div style="padding:30px">
                            <div style="display:inline-block;padding:7px 10px;background:#eaf5eb;color:#347343;font-size:12px;font-weight:700">PURCHASE CONFIRMED</div>
                            <h1 style="font-family:Georgia,serif;font-size:30px;font-weight:400;line-height:1.2;margin:20px 0 10px">Welcome to the deeper read, ${name}.</h1>
                            <p style="font-size:14px;line-height:1.7;color:#69635f;margin:0 0 24px">Your NewsHub Premium subscription is active. You can now explore the full member library from the Premium section of NewsHub.</p>
                            <div style="padding:17px 18px;background:#f8f6f2;border:1px solid #eee9e3">
                                <div style="font-size:11px;color:#827a72;letter-spacing:1px">ANNUAL MEMBERSHIP</div>
                                <div style="font-size:24px;font-weight:700;margin-top:5px">${amount}</div>
                                <div style="font-size:12px;color:#69635f;margin-top:12px">Access period: ${startDate} – ${endDate}</div>
                                <div style="font-size:11px;color:#827a72;margin-top:9px">Payment reference: ${paymentId}</div>
                            </div>
                            <p style="font-size:12px;line-height:1.7;color:#827a72;margin:23px 0 0">Keep this email for your records. Thank you for supporting thoughtful journalism.</p>
                        </div>
                    </div>
                    <div style="max-width:560px;margin:14px auto 0;text-align:center;color:#928b84;font-size:10px">NewsHub · Read widely. Think clearly.</div>
                </div>
            `,
        });
        return true;
    } catch {
        console.error("Subscription was activated, but its confirmation email could not be sent.");
        return false;
    }
}

module.exports = sendSubscriptionConfirmationEmail;
