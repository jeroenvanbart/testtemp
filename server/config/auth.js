const userAuthentication = (req, res, next) => {
    if (req?.session?.authenticated) {
        console.log('Authenticated')
        return next()
    }
    return res.status(401).redirect('/login')
}

const apiUserAuthentication = (req, res, next) => {
    if (req?.session?.authenticated) {
        console.log('Authenticated')
        return next()
    }
    return res.status(401).send({message: "You are not logged in."})
}

module.exports =  {
    userAuthentication,
    apiUserAuthentication
}