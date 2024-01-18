const jwt = require("jsonwebtoken");
const Registration = require("../models/registrations");

const resetAuth = async (req, res, next) => {
    try {
        const resetToken = req.params.rtoken;
        const verifyUser = jwt.verify(resetToken, process.env.RESET_SECRET_KEY);
        // console.log(verifyUser);

        const user = await Registration.findOne({_id: verifyUser._id});
        // console.log(user);

        req.token = resetToken;
        req.user = user;

        next();
    } catch (error) {
        res.status(401).send(error);
    }
}

module.exports = resetAuth;