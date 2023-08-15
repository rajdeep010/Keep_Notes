const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')



const SECRET = process.env.SECRET_KEY



const userSchema = new mongoose.Schema({
    username : {
        type: String,
        required: true,
        unique: true
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    confirmpassword: {
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
})


// working on instances of schema so using '.methods'
// else with collection use '.statics'
userSchema.methods.generateAuthToken = async function() {

    try{
        const token = jwt.sign({_id: this._id.toString()}, SECRET, {
            expiresIn: '1 day'
        })

        this.tokens = this.tokens.concat({token: token})

        await this.save()

        return token
    }

    catch(error){
        res.status(400).send('Error in authentication')
        console.log(error)
    }
}

userSchema.statics.checkLoginDetails = async (email, password) => {
    const user = await User.findOne({email})

    if(!user){
        throw new Error('Auth failed for not registered')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error('Password mismatch while login')
    }

    return user
}


// before saving it to the database.. hash the password using bcrypt js
userSchema.pre('save', async function(next) {
    const nowUser = this

    if(nowUser.isModified('password')){
        nowUser.password = await bcrypt.hash(nowUser.password, 10)
        nowUser.confirmpassword = await bcrypt.hash(this.password, 10)
    }

    next()
})

// Create a collection --- Define Model
const User = mongoose.model('User', userSchema)


module.exports = User