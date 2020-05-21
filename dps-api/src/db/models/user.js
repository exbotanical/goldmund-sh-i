const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes("password" || "$")) {
                throw new Error("Password cannot contain 'password' or '$'");
            }
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        required: true,
        default: 'user'
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
},
    { timestamps: true }
);

// modify JWT
UserSchema.methods.toJSON = function() {
    const userObject = this.toObject();

    delete userObject.password
    delete userObject.tokens

    return userObject
}

// gen JWT
UserSchema.methods.generateAuthToken = async function() {
    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET, { expiresIn: 60 });
    // persist user's tokens to db so as to keep track of them...
    this.tokens = this.tokens.concat({ token });

    return token
}

// fetches user by email, then by matching plaintext to hashed pw
UserSchema.statics.findByCredentials = async (email, password) => {
    // attempt to match email first; isnt hashed, ergo more expedient
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error("Unable to login.");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Unable to login.");
    }
    return user
}

// hash plaintext pw prior to persisting
UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 9);
    }
 
    next();
})

const User = mongoose.model('User', UserSchema);

module.exports = User