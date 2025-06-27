//Authorize Function

const authorize = ( ...allowedRoles ) => {
    return(req,res,next) => {
        if(!req.session || !req.session.user) //No Login or No User
        {
            return res.status(401).json({message: 'Unauthorized Please Login' })
        }
        const { role } = req.session.user
        if(!allowedRoles.includes(role))
        {
            return res.status(403).json({message: 'Forbidden No Permission' })
        }
        next()
    }
}

module.exports = authorize