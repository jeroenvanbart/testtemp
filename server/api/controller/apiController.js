const FMS = require('fms-api-client')
const {
    connect
} = require('marpat')
const bcrypt = require('bcrypt')
const {
    v4: uuid
} = require('uuid')
const nodemailer = require('nodemailer')

const connection =
    connect('nedb://memory')
    .then(db => {
        const client = FMS.Filemaker.create({
            database: process.env.FM_DATABASE,
            server: process.env.FM_SERVER,
            user: process.env.FM_USER,
            password: process.env.FM_PASSWORD,
        });

        return client.save()
    }).catch((err) => {
        console.error(err)
    })


module.exports.supportPostApp = async (req, res) => {
    console.log('support')

    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(req.body.email)) {
        return res.status(400).render('layouts/support', {
            message: 'No valid email has been supplied'
        })
    } else {


        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });


        await new Promise((resolve, reject) => {
            // verify connection configuration
            transporter.verify(function (error, success) {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log("Server is ready to take our messages");
                    resolve(success);
                }
            });
        });

        const subject = req.body?.subject?.trim()
        const name = req.body?.name?.trim()
        const email = req.body?.email?.trim()
        const message = req.body?.message?.trim()
        const emailMessage = `
                    <table>
                        <tr>
                            <td>Subject:</td>
                            <td>${subject}</td>
                        </tr>
                        <tr>
                            <td>Name:</td>
                            <td>${name}</td>
                        </tr>
                        <tr>
                            <td>Email:</td>
                            <td>${email}</td>
                        </tr>
                        <tr>
                            <td>Message:</td>
                            <td>${message}</td>
                        </tr>
                    </table>`

        const mailData = {
            from: process.env.SMTP_USER,
            replyTo: email,
            to: process.env.SMTP_TO,
            replyTo: req.body.email,
            subject: subject,
            html: emailMessage
        };


        try {
            const sendmail = await new Promise((resolve, reject) => {
                // send mail
                transporter.sendMail(mailData, (err, info) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        console.log(info);
                        resolve(info);
                    }
                });
            });

            if (sendmail) {
                return res.status(200).render('layouts/support', {
                    message: 'Email has been send.'
                })
            }
        } catch (error) {
            console.log(error)
        }
        return res.status(400).render('layouts/support', {
            message: 'Something went wrong, please try again.'
        })
    }


}




module.exports.loginPostApp = async (req, res) => {
    // console.log(req.body)
    if (!req.body.emailAddress.length > 0 || !req.body.password.length > 0) {
        return res.status(400).send({
            message: 'Credentials incorrect'
        })
    }

    const userEmail = req.body.emailAddress
    const userPassword = req.body.password

    const fms = await connection.catch((err) => {
        console.error(err)
    })

    const userCheck = await fms.find('API_Users', [{
        'EmailAddress': `==\"${userEmail}\"`
    }]).catch((err) => {
        console.error(err)
        var error = ''
        if (err.code == '802') {
            error = 'Unable to connect to database'
        } else {
            error = 'Something went wrong with the search'
        }
        fms.logout()
        return res.status(500).send(error)
    })
    // console.log(userCheck)

    if (userCheck.data.length > 0) {
        await passwordCheck(userPassword, userCheck.data[0].fieldData.Password)
            .then((result) => {
                // console.log('Succes app login');
                req.session.authenticated = true
                req.session.userId = userCheck.data[0].fieldData.UUID_User
                fms.logout()
                return res.status(200).send({
                    message: 'Logged in'
                })
            })
            .catch((err) => {
                console.error('Error loggin in', err)
                fms.logout()
                return res.status(401).send({
                    message: 'Password is incorrect'
                })
            })
    } else {
        console.error("User not found")
        fms.logout()
        return res.status(400).send({
            message: 'User not found'
        })
    }

}

module.exports.forgotPostApp = async (req, res) => {
    if (!req?.body?.email) {
        console.error('Error post')
        return res.status(500).send('Please supply a valid email address')
    }

    const fms = await connection.catch((err) => {
        console.error(err)
    })

    const resetRequest = await fms.find('API_Users', [{
        'EmailAddress': `==\"${req.body.email}\"`
    }]).catch((err) => {
        console.error('Error retrieving email for reset request', err)
    })

    if (resetRequest?.data[0]?.recordId?.length > 0) {
        let resetToken = uuid()
        let recordId = resetRequest.data[0].recordId
        const resetUpdate = await fms.edit('API_Users', recordId, {
            ResetToken: resetToken
        }).catch((err) => {
            console.error('Error setting resetToken', err)
            fms.logout()
            return res.status(500).send('Something went wrong, please try again later or contact your administrator')
        })

        if (resetUpdate?.modId) {
            const resetScript = await fms.script('API_Users', 'Reset_Mail', resetRequest.data[0].fieldData.UUID_User).catch((err) => {
                console.error(err)
                fms.logout()
                return res.redirect('back')
            })

            fms.logout()
            if (resetScript.scriptError != 0) {
                return res.status(400).send({
                    message: 'Something went wrong, please try again later or contact your administrator'
                })
            }
        }
    }
    return res.status(200).send({
        message: 'If an account is linked with this email address you will receive an email with a link to reset your password'
    })
}

const passwordCheck = async (password, check) => {
    /**
     * @param password  user input
     * @param check     hash to be checked
     */
    return new Promise(async (response, reject) => {
        const checkedPassword = await bcrypt.compare(password, check).catch((err) => {
            console.error('Error Comparing hashes', err)
            return reject(err)
        })
        // console.log(checkedPassword)
        if (checkedPassword) {
            return response(true)
        } else {
            return reject(false)
        }

    })
}