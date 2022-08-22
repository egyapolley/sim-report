const nodemailer = require("nodemailer");
require("dotenv").config()


module.exports = async (data) => {
    const {to, message, date} = data


    const transporter = nodemailer.createTransport({
        host: "172.25.36.10",
        port: 825,
        secure: false,
        tls: {

            rejectUnauthorized: false
        },
        connectionTimeout: 5000
    });


    const mailOptions = {
        from: "servicedesk@surflinegh.com",
        to: to,
        subject: `NCA SIM REGISTRATION REPORT : ${date}`,
        html: message
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Message sent: %s", info.messageId);


}



