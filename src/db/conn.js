require('dotenv').config()
const mongoose = require('mongoose')
const DB_URL = process.env.DB_CONNECT_URL


mongoose.connect(DB_URL)
.then( () => {
    console.log('Connection to database successful')
})
.catch( (err) => {
    console.log('Error in making database connection ' + err)
})