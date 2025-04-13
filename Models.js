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
        required: false,
        lowercase: true,
        trim: true,
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
    strike: {
        type: Number,
        default: 0
    },
    redeemStrike: {
        email: {
            type: Boolean,
            default: false
        },
        wallet: {
            type: Boolean,
            default: false
        },
    },
    lastStrike: {
        type: String,
        default: ""
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
    groups:[
        {
            type: String,
            required: true,
            ref: 'group'
        }
    ],
});

const groupSchema = new Schema({
    status: {
        type: String,
        default: "waiting"
    },
    winners: [
        {
            winnerId: {
                type: String,
                required: true,
            },
            Tokens_Earned: {
                type: Number,
                required: true
            }
        }
    ],
    userId: {
        type: String,
        required: true,
        ref: 'Users'
    },
    name:{
        type: String,
        required: true,
        unique: true
    },
    duration: {
        type: Number,
        required: true
    },
    startingDate: {
        type: Date,
        default: new Date,
    },
    stakeAmount: {
        type: Number,
        required: true
    },
    members:[
        {
            type: String,
            required: true,
            ref: 'Users'
        }
    ],
    maximumMember: {
        type: Number,
        required: true
    },
    mininumMember: {
        type: Number,
        required: true
    },
    createdAt:{
        type: Date,
        default: Date()
    },
    
});

const Users = Model('Users', userSchema);
const group = Model('group', groupSchema);

module.exports = {
    Users:Users,
    group
};