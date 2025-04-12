const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const Users = require("./Routes/User.js");

const app = express();
dotenv.config();
const Port = process.env.Port;
// 'http://localhost:3000', 'http://localhost:5173',
const corsOptions = {
    origin: ['https://wellnotes1-00.vercel.app', 'http://localhost:5173', 'https://zipbuy.in'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
};


app.use(cors(corsOptions));
app.use('/img', express.static('./Images/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use("/api", Users);

app.get("/", (req, res) => {
    res.status(200).json({
        Status: "Success",
        Message: "Server is running",
    });
});

app.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
});
