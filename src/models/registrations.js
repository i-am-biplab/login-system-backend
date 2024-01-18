const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const regSchema = mongoose.Schema({
    fisrtname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    gender: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true,
        unique: true,
        maxlength: 10
    },
    age: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
});

// generate JWT
regSchema.methods.generateAuthToken = async function() {
    try {
        const token = jwt.sign({_id: this._id.toString()}, process.env.SECRET_KEY, {expiresIn: "1d"});
        this.tokens = this.tokens.concat({token: token});
        await this.save();
        return token;
    } catch (error) {
        res.send(error);
    }
}

// generate JWT reset token
regSchema.methods.generateResetToken = async function() {
    try {
        const resetToken = jwt.sign({_id: this._id.toString()}, process.env.RESET_SECRET_KEY, {expiresIn: "10m"});
        this.tokens = this.tokens.concat({token: resetToken});
        await this.save();
        return resetToken;
    } catch (error) {
        res.send(error);
    }
}

// hash password before saving to database
regSchema.pre("save", async function(next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

const Registration = mongoose.model("Registration", regSchema);

module.exports = Registration;