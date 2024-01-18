const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: "smtp.gmail.com",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
    },
});

const sendMail = async (url, email) => {
    try {
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Password Reset Link',
            html: `<p>Hello,</p><p>Your password reset link is <br><a href="${url}">${url}</a><br></p>By clicking on the link, if you are not redirected, please copy paste the link in the browser.</p>`
        }

        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('mail send Error:', error);
            } 
        });
    } catch (error) {
        return res.send(error);
    }
}

module.exports = sendMail;