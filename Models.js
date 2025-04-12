const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();
const URL = `mongodb+srv://${process.env.Mongodb_Username}:${process.env.Mongodb_Password}@${process.env.Mongodb_Domain}/${process.env.Mongodb_DataBase}`;

mongoose.connect(URL);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to database');
});
const Schema = mongoose.Schema;
const Model = mongoose.model;








const userSchema = new Schema({
    _id:{
        type: String,
        required: true
    },
    Email:{
        type: String,
        required: true,
        lowercase: true,
    },
    Name:{
        type: String,
        default: "",
    },
    Profile:{
        type: String,
        default: "",
    },
    Authentication:{
        Token:{
            type: String,
        },
        Date:{
            type: Date,
            default: Date()
        }
    },
    Tokens_Earned:{
        type: Number,
        required: true
    },
    Journals:[
        {
            _id : false,
            ID:{
                type: String,
                required: true
            },
            Title:{
                type: String,
                required: true
            },
            Description:{
                type: String,
                required: true
            },
            Date:{
                type: Date,
                default: Date()
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date()
    },
});

const Users = Model('Users', userSchema);

module.exports = {
    Users:Users
};