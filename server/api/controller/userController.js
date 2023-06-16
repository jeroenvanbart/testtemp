const FMS = require('fms-api-client')
const { connect } = require('marpat')
const bcrypt = require('bcrypt')
const {v4: uuid} = require('uuid')

const connection =
    connect('nedb://memory')
  //#
  .then(db => {
    //#client-create-example
    const client = FMS.Filemaker.create({
      database: process.env.FM_DATABASE,
      server: process.env.FM_SERVER,
      user: process.env.FM_USER,
      password: process.env.FM_PASSWORD,
    });
    //#
    //#client-save-example
    return client.save()
  }).catch((err) => { console.error(err) })

module.exports.login = async (req, res) => {
    return res.render('users/login')
}

module.exports.loginPost = async (req, res) => {
    // console.log(req.body)
    if(!req.body.emailAddress.length > 0 && !req.body.password.length > 0) {
        return res.status(400).send('Credentials incorrect')
    }

    const userEmail = req.body.emailAddress
    const userPassword = req.body.password

    const fms = await connection.catch((err) => {
        console.error(err)
    })

    const userCheck = await fms.find('API_Users', [{'EmailAddress': `==\"${userEmail}\"`}]).catch((err) => {
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
    fms.logout()
    if(userCheck.data.length > 0) {
        const confirmPassword = await passwordCheck(userPassword, userCheck.data[0].fieldData.Password)
        .then((result) => {
            // console.log('Succes');
            req.session.authenticated = true
            return res.redirect('/download')
        })
        .catch((err) => {
            console.error('Error loggin in', err)
            req.session.message = 'Password is incorrect'
            return res.redirect('back')
        })
    } else {
        console.error("User not found")
        req.session.message = 'User not found'
        return res.redirect('back')
    }
    


}

module.exports.register = async (req, res) => {
    if(!req.params?.token?.length > 0) {
        // console.log('!token')
        req.session.message = {type:'danger', data:'Activation token is invalid, please contact your administrator.'}
        return res.redirect('back')
    }

    const fms = await connection.catch((err) => {
        console.error(err)
    })

    const userRegistration = await fms.find('API_Users', [{'ActivationToken': `==\"${req.params.token}\"`, 'FirstTimeLogin':'==1'}]).catch((err) => {
        console.error('Error getting user for registration')
        fms.logout()
        return res.redirect('back')
    })

    fms.logout()
    // console.log(userRegistration)
    if(userRegistration.data[0]) {
        let email = userRegistration.data[0].fieldData.EmailAddress
        return res.render('users/register',{email: email})
    } else {
        return res.render('users/register', {message: 'Activation token is invalid, please contact your administrator.'})

    }
}

module.exports.registerPost = async (req, res) => {
    if(!req.body?.email?.length > 0 && !req.body?.new_password?.length > 0) {
        res.redirect('back')
    }
    if(req.body.new_password !== req.body.confirm_password) {
        return res.status(400).send('Passwords do not match')
    }

    // console.log(req.body)

    const hashedPassword = await encryptPassword(req.body.new_password).catch((err) => {
        console.error(err)
    })

    const fms = await connection.catch((err) => {
        console.error(err)
    })

    const checkEmail = await fms.find('API_Users', [{'EmailAddress': `==\"${req.body.email}\"`}]).catch((err) => {
        console.error(err)
        fms.logout()
        res.redirect('back')
    })

    // console.log(checkEmail.data[0].fieldData)
    if(checkEmail?.data?.length > 0){
        let recordId = checkEmail.data[0].recordId
        // console.log(recordId)
        const data = {
            Password: hashedPassword,
            FirstTimeLogin: 0
        }
    
        const updateUser = await fms.edit('API_Users', recordId, data)
        .then((user) => {
            // console.log(user)
            fms.logout()
            return res.redirect('/download')
        })
        .catch((err) => {
            console.error('Error creating new user',err)
            req.session.message = {type:'danger', data:'An error occurred while saving your password'}
            fms.logout()
            return res.redirect('back')
        })
    } else {
        console.error('Unknown user')
        req.session.message = {type:'warning', data:'Unknown email address'}
        fms.logout()
        return res.redirect('back')
    }

}

module.exports.forgot = async (req, res) => {
    return res.render('users/forgot')
}

module.exports.forgotPost = async (req, res) => {
    if (!req?.body?.email) {
        console.error('Error post')
        req.session.message = 'Please supply a valid email address'
        return res.redirect('back')
    }

    const fms = await connection.catch((err) => {
        console.error(err)
    })

    const resetRequest = await fms.find('API_Users', [{'EmailAddress': `==\"${req.body.email}\"`}]).catch((err) => {
        console.error('Error retrieving email for reset request', err)
    })
    // console.log(resetRequest?.data[0])
    if (resetRequest?.data[0]?.recordId?.length > 0) {
        let resetToken = uuid()
        let recordId = resetRequest.data[0].recordId
        const resetUpdate = await fms.edit('API_Users', recordId, {ResetToken: resetToken} ).catch((err) => {
            console.error('Error setting resetToken', err)
            req.session.message = {type:'error', data:'There was a problem with the request'}
            fms.logout()
            return res.redirect('back')
        })

        if (resetUpdate?.modId) {
            const script = await fms.script('API_Users', 'Reset_Mail', resetRequest.data[0].fieldData.UUID_User).catch((err) => {
                console.error('Error firing script', err)
                req.session.message = {type:'error', data:'There was a problem sending the mail'}
                fms.logout()
                return res.redirect('back')
            })
            console.log('Script result', script)

            req.session.message = {type:'success', data:'Your request has been processed. Check your inbox for a link to reset your password'}
            fms.logout()
            return res.redirect('back')
        }
    } else {
        req.session.message = {type:'warning', data:'The email address you supplied is not linked to an account'}
        fms.logout()
        return res.redirect('back')
    }

}

module.exports.reset = async (req, res) => {
    if (!req?.params?.token) {
        req.session.message = {type:'error', data:'Error resetting token'}
        return res.redirect('back')
    }

    const fms = await connection.catch((err) => {
        console.error(err)
        return res.redirect('back')
    })

    const resetToken = await fms.find('API_Users', [{'ResetToken': `==\"${req.params.token}\"`}]).catch((err) => {
        console.error('Error resetting password', err)
        fms.logout()
        return res.redirect('back')
    })

    fms.logout()
    if (resetToken?.data[0]?.recordId?.length > 0) {
        return res.render('users/reset', {token: req.params.token})
    } else {
        let errorMessage = {type:'warning', data:'Invalid reset token'}
        console.error('Invalid token', req?.params?.token)
        return res.render('users/reset', {errorMessage: errorMessage})
    }
}

module.exports.resetPost = async (req, res) => {
    if (!req?.body?.new_password) {
        req.session.message = {type:'error', data:'Error resetting password'}
        return res.redirect('back')
    }
    if (req?.body?.new_password != req?.body?.confirm_password) {
        req.session.message = {type:'error', data:'Passwords do not match'}
        return res.redirect('back')
    }

    const fms = await connection.catch((err) => {
        console.error(err)
        return res.redirect('back')
    })

    const resetPassword = await fms.find('API_Users', [{'ResetToken': `==\"${req.body.token}\"`}]).catch((err) => {
        console.error('Error resetting password', err)
        fms.logout()
        return res.redirect('back')
    })

    if (resetPassword?.data[0]?.recordId?.length > 0) {
        let recordId = resetPassword.data[0].recordId
        let newPassword = await encryptPassword(req.body.new_password).catch((err) => {
            console.error('Error encrypting password', err)
            fms.logout()
            return res.redirect('back')
        })
        const passwordUpdate = await fms.edit('API_Users', recordId, {Password: newPassword} ).catch((err) => {
            console.error('Error setting resetToken', err)
            req.session.message = {type:'error', data:'There was a problem with the request'}
            fms.logout()
            return res.redirect('back')
        })
        fms.logout()
        if (passwordUpdate?.modId) {
            req.session.message = {type:'success', data:'You have successfully reset your password. You can now login with your new password'}
            return res.redirect('back')
        }
    } else {
        req.session.message = {type:'warning', data:'Invalid reset token'}
        return res.redirect('back')
    }

}



const encryptPassword = async (password) => {
    /**
     * @param password  user input to be encrypred
     */
    return new Promise(async(response, reject) => {
        const hashedPassword = await bcrypt.hash(password, 10).catch((err) => {
            console.error('Error Hashing', err)
            return reject(err)
        })

        if(hashedPassword) {
            return response(hashedPassword)
        } else {
            return reject(false)
        }
    })
}

const passwordCheck = async (password, check) => {
    /**
     * @param password  user input
     * @param check     hash to be checked
     */
    return new Promise(async(response, reject) => {
        const checkedPassword = await bcrypt.compare(password, check).catch((err) => {
            console.error('Error Comparing hashes', err)
            return reject(err)
        })
        // console.log(checkedPassword)
        if(checkedPassword) {
            return response(true)
        } else {
            return reject(false)
        }

    })
}

module.exports.loggedIn = async (req, res) => {
    console.log("TEST")
    console.log(req.session)
    if(req.session?.authenticated) {
        return res.status(200).send({message: "Authenticated"})
    }
    else{
        return res.status(401).send({message: "Unauthenticated"})
    }
}