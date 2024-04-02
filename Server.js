const express = require('express')
const dotenv = require('dotenv').config()
const connectDb = require('./config/database')
const cors = require('cors')
const bodyParser = require('body-parser')
const port = process.env.PORT || 5000

connectDb()
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())

app.use('/api', require('./routes/PhotoImage'))
app.use('/user', require('./routes/Login'))
app.use('/predict', require('./routes/Predict'))
app.use('/test', require('./routes/Test'))
// app.set('view engine', 'ejs');
app.listen(port, () => console.log(`server started on port ${port}`))