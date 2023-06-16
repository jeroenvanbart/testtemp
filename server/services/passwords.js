const bcrypt = require('bcrypt');

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

        if (checkedPassword) {
            return response(true)
        } else {
            return response(false)
        }

    })
}

const checkAuth = (userId, userType) => {
    if (userId == null && userType !== "SuperUser") {
        return false
    }
    else {
        return true
    }
}

module.exports = {
    passwordCheck, checkAuth
}
