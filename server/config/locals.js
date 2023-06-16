module.exports.locals = (req, res, next) => {

    res.locals.message = req.session.message

    // Reset message

    req.session.message = null

    return next()
}