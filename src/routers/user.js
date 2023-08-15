const express = require('express')
const router = new express.Router()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const moment = require('moment')
const auth = require('../middleware/auth')


router.use(express.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())
router.use(cookieParser())


const User = require('../models/userSch')
const Document = require('../models/docSch')


// -----*** Home Page related routes ***----
router.get('/list', (req, res) => {
    res.render('static/idea-stage')
})

router.get('/manage', (req, res) => {
    res.render('static/manage')
})

router.get('/notesmanage', (req, res) => {
    res.render('static/notes-manage')
})

router.get('/family', (req, res) => {
    res.render('static/taking-care-good')
})


// ---- setting up multer storage and call-back function -----
const storage = multer.memoryStorage()

const upload = multer({

    limits: 100000,

    fileFilter(req, file, cb) {

        if (file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|PNG|png)$/)) {
            cb(undefined, true)
        }

        else {
            cb(new Error("Please upload only .jpg file"))
            cb(undefined, false)
        }
    },

    storage
})

// !  ----------/////// ******* SIGN-IN, SIGN-OUT, LOG-OUT ******** \\\\\\\ ----------


//  ----****** Sign Up User ******----
router.post('/signup', async (req, res) => {

    try {
        const pw = req.body.password
        const cpw = req.body.confirmpassword

        if (pw != cpw) {
            return res.status(400).render('static/no-pass-match')
        }

        const user = new User(req.body)


        // before calling the save method password must be hashed
        const createUser = await user.save()

        res.status(201).render('signup')
    }

    catch (err) {
        res.render('static/error', {
            reason: 'Error in SignUp'
        })
    }
})


// ********* Sign In User *********
router.post('/signin', async (req, res) => {

    try {
        const email = req.body.email
        const password = req.body.password

        const user = await User.checkLoginDetails(email, password)

        const token = await user.generateAuthToken()

        res.cookie('KeepNotes', token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true
        })

        res.status(200).redirect('dashboard')
    }

    catch (error) {
        res.render('static/page404')
    }
})


// *********** Log Out User **************
router.get('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = []

        res.clearCookie('KeepNotes')
        await req.user.save()

        res.status(200).render('home')

    }
    catch (error) {
        res.render('static/error', {
            reason: 'Error in Logging Out'
        })
    }
})


//  --- *** USER related all the pages will be handled here ***---


// -----*** Home Page related routes ***----
router.get('/dashboard', auth, async (req, res) => {
    try {
        const person_id = req.user._id

        const all_docs = await Document.find({ "person_id": person_id })

        res.render('dashboard', {
            username: req.user.username,
            documents: all_docs,
        })
    }

    catch (err) {
        res.render('static/error', {
            reason: 'Dashboard Render Error'
        })
    }
})

// ! -------******* Searching For Notes *******-------
router.get('/search', auth, (req, res) => {
    try{
        const query = req.body.searchInput
    }catch(err){
        res.render('static/error', {
            reason: 'You are not authorize for searching'
        })
    }
})


// ! ----------***** Notes Adding Pages *****----------
router.get('/docadd', auth, (req, res) => {
    res.render('docadd', {
        username: req.user.username
    })
})

router.post('/docadd', auth, upload.single('Note'), async (req, res) => {

    try {
        const obj = JSON.parse(JSON.stringify(req.body))

        req.user.file = req.file.buffer

        obj.person_id = req.user._id

        obj.file = req.file.buffer

        const doc = new Document(obj)

        const createDoc = await doc.save()

        res.render('docadd', {
            username: req.user.username
        })
    }

    catch (error) {
        res.render('static/error', {
            reason: 'Error in Adding Document'
        })
    }
})


//! -----**** Show the prescription ****----
router.get('/docs/:id', async (req, res) => {
    try {
        const _id = req.params.id

        const pic = await Document.findById(_id)

        res.set("Content-Type", "image/jpg");

        res.send(pic.file)

    } catch (error) {
        res.render('static/page404')
    }
})

//! -----**** Delete the prescription ****----
router.post('/docs/delete/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id

        const doc = await Document.findByIdAndDelete(_id)

        if (!doc)
            return res.status(404).send()

        const person_id = req.user._id

        const all_docs = await Document.find({ "person_id": person_id })

        res.redirect('../../dashboard', {
            username: req.user.username,
            documents: all_docs,
            moment: moment
        }, 201)

    } catch (err) {
        res.render('static/error', {
            reason: 'Error in Deleting Document'
        })
    }
})

router.get('/error', (req, res) => {
    res.render('static/error')
})


module.exports = router