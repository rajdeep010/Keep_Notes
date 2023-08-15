const mongoose = require('mongoose')

const docSchema = new mongoose.Schema({
    person_id: {
        type: String
    },
    noteTitle: {
        type: String,
        required: true
    },
    noteDate: {
        type: Date
    },
    description: {
        type: String,
    },
    file: {
        type: Buffer,
    }
})

const Document = mongoose.model('Document', docSchema)

module.exports = Document