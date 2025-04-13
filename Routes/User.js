const Routes = require('express');
const jwt = require('jsonwebtoken');
const User = Routes.Router();
module.exports = User;
const {Users}  = require("../Models.js");
require("dotenv").config();

const group = require("../controller/group.js");

function isValidEmail(mail) {
    const a = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return a.test(mail);
};
function Profile_ID() {
    const length = 13;
    let randomID = '';
    while (randomID.length < length) {
        randomID += Math.random().toString().slice(2);
    }
    return randomID.slice(0, length);
};

function Create_JWT_Token(payload){
    const opt = {
        issuer: 'WellNotes',
        expiresIn: '30d',
    };
    try{
        const Token = jwt.sign({payload}, process.env.JWT_Secret, opt);
        return Token;
    }catch{
        return null;
    };
};
function Verify_JWT_Token(Token){
    const opt = {
        issuer: 'WellNotes',
        expiresIn: '30d',
    };
    try{
        const decoded = jwt.verify(Token, process.env.JWT_Secret, opt);
        return decoded;
    }catch (e){
        return null;
    };
};
function Create_Authentication_Token(){
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!@#$%^&*()_+{}|:"<>?';
    let Token = '';
    for (let i = 0; i < 20; i++) {
        Token += characters.charAt(Math.floor(Math.random() * characters.length));
    };
    return Token;
};

const ValidToken = async Token =>{
    try{
        if(Token){
            let a = Verify_JWT_Token(Token);

            
            
            a = a.payload;
            if(a){
                let GetUser = await Users.findOne({_id: a.ID});
                if(GetUser){
                    if(GetUser.Authentication.Token == a.Token){
                        return GetUser;
                    }else{
                        return null;
                    };
                }
            }else{
                return null;
            };
        };
        return null;
    }catch{
        return null;
    }
};
// Server is running
User.get("/", (req, res) => {
    res.status(200).json({
        Status: "Success",
        Message: "User route is working",
    });
});

// Authenticate user
User.post("/auth", async (req, res) => {
    async function main(userId) {
 
        if (userId) {
            let data = await Users.findOne({_id: userId});
                // If User exists
            if (data) {
                const Token = Create_Authentication_Token();
                const Auth = Create_JWT_Token({
                    Token: Token,
                    ID: data._id,                    
                });
                await Users.updateOne({_id: userId}, {$set: {
                    "Authentication.Token": Token,
                    "Authentication.Date": new Date()
                }}).then(()=>{
                    return res.status(200).json({
                        Status: "Success",
                        token: Auth,
                        Message: "User authenticated",
                    });
                }).catch(()=>{
                    return res.status(500).json({
                        Status: "Error",
                        Message: "Internal server errors",
                    });
                });
            }else{ 
                // // If user does not exist
                const Token = Create_Authentication_Token();
                // let ID = "";
                // while (true){
                //     ID = Profile_ID();
                //     const check = await Users.findOne({_id: ID});
                //     if (!check) {
                //         break;
                //     };
                // };
                const Auth = Create_JWT_Token({
                    Token: Token,
                    ID: userId
                }); 
                const New_User = new Users({
                    _id: userId,
                    Authentication:{
                        Token: Token,
                        Date: new Date(),
                    },
                    
                    Journals: [],
                    Tokens_Earned: 0,
                    createdAt: new Date(),
                });
                await New_User.save().then(()=>{
                    
                    return res.status(200).json({
                        Status: "Success",
                        Message: "User created",
                        token: Auth,
                    });
                }).catch(e=>{
                    return res.status(500).json({
                        Status: "Error",
                        Message: "Internal server error",
                    });
                });
            };
        
        }else{
            return res.status(400).json({
                Status: "Error",
                Message: "UserId Required",
            });
        };
    };
    await main(req.body.userId).catch(e=>{
        return res.status(500).json({
            Status: "Error",
            Message: "Internal server error",
        });
    })
    
    // (async () => {
    //     try {
    //         const token = req.body.token;
            
    //         if (!token) {
    //             return res.status(400).json({
    //                 Status: "Error",
    //                 Message: "Token is required",
    //             });
    //         };
            
    //         let decodedToken;
    //         try {
    //             decodedToken = await admin.auth().verifyIdToken(token);
                
    //             if (!decodedToken) {
    //                 return res.status(401).send({ message: 'Authentication failed' });
    //             };
    //             await main(decodedToken.email, decodedToken.name, decodedToken.picture).catch(error => {
    //                 return res.status(500).json({
    //                     Status: "Error",
    //                     Message: "Internal server error",
    //                 });
    //             });

    //         } catch (error) {
    //             return res.status(401).send({ message: 'Authentication failed' });
    //         };

    //     } catch (error) {
    //         return res.status(500).json({
    //             Status: "Error",
    //             Message: "Internal server error",
    //         });
    //     }
    // })();
});
// Create a new Journal
User.post("/new_journal", async (req, res) => {
    async function main(CheckedUser) {
        const {Title, Description} = req.body;
        // console.log(req.body);
        // console.log(Title);
        // console.log(Description);
        // console.log(Token);
        if (Title && Description) {
            if (Title.length > 3 && Title.length < 100) {
                if (Description.length > 3 && Description.length < 1000) {
                    const Journal = {
                        Title: Title,
                        Description: Description,
                        ID: Date.now(),
                        Date: new Date(),
                    };
                    let New_Journal = CheckedUser.Journals;
                    New_Journal.push(Journal);

                    let currentStrike = CheckedUser.strike;

                    const currentCheck = new Date().toISOString().split('T')[0]
                    
                    const lastCheck = CheckedUser.lastStrike;

                    // console.log(new Date(lastCheck),"_____" , new Date(currentCheck));
                    // console.log(new Date(lastCheck).getTime() === new Date(currentCheck).getTime());

                    let q = CheckedUser.redeemStrike;
                    if (new Date(lastCheck).getTime() === new Date(currentCheck).getTime()) {
                        currentStrike = CheckedUser.strike;

                    } else if (new Date(lastCheck).getTime() < new Date(currentCheck).getTime()) {
                        let da = new Date(lastCheck)
                        da.setDate(da.getDate() - 1);
                        let pa = new Date(currentCheck);
                        pa.setDate(pa.getDate() - 1);
                        if (da.getTime() === pa.getTime()) {
                            console.log("____", new Date(lastCheck).getTime(), new Date(currentCheck).getTime());
                            currentStrike = CheckedUser.strike-1;
                        }else{
                            currentStrike = 0;
                            
                            q = {
                                email: false,
                                wallet: false,
                            }
                        }
                    }else{
                        currentStrike = CheckedUser.strike-1;
                    }

                    await Users.updateOne({_id: CheckedUser._id}, {
                        strike: currentStrike+1,
                        lastStrike: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        Journals: New_Journal,
                        redeemStrike: q,
                        Tokens_Earned: CheckedUser.Tokens_Earned+1
                    }).then(()=>{
                        return res.status(200).json({
                            Status: "Success",
                            Message: "Journal added successfully",
                            Journal: Journal,
                        });
                    }).catch(e=>{
                        
                        // console.log(e);
                        return res.status(500).json({
                            Status: "Error",
                            Message: "Internal server error",
                        });
                    });
                
                }else{
                    return res.status(200).json({
                        Status: "Error",
                        Message: "Description must be at least 3 characters and maximum of 1000 characters",
                    });
                };
            }else{
                return res.status(400).json({
                    Status: "Error",
                    Message: "Title must be at least 3 characters and maximum of 100 characters",
                });
            };
        }else{
            return res.status(400).json({
                Status: "Error",
                Message: "Title and Description are required",
            });
        };
    };
    const a = await ValidToken(req.body.Token);
    if(a){
        main(a).catch(e=>{
            return res.status(500).json({
                Status: "Error",
                Message: "Internal server error",
            });
        });
    }else{
        return res.status(403).json({
            Status: "Error",
            Message: "Unauthorized access, please login and try again later.",
        });

    }
});

// Get all Journal 
User.post("/all_journals", async (req, res) => {
    async function main(CheckedUser){
                
        return res.status(200).json({
            Status: "Success",
            Journals: CheckedUser.Journals,
        });
    };
    const a = await ValidToken(req.body.Token);
    if(a){
        main(a).catch(()=>{
            return res.status(500).json({
                Status: "Error",
                Message: "Internal server error",
            });
        });
    }else{
        return res.status(403).json({
            Status: "Error",
            Message: "Unauthorized access, please login and try again later.",
        });

    }
});
// Get a Journal by ID
User.post("/journals/:id", async (req, res) => {
    async function main(CheckedUser){
        const id = req.params.id;
        let Journals = CheckedUser.Journals;
        for (let i = 0; i < Journals.length; i++) {
            const element = Journals[i];
            if (element.ID == id) {
                return res.status(200).json({
                    Status: "Success",
                    Journal: element,
                });
            };
        };
        return res.status(404).json({
            Status: "Error",
            Message: "Journal not found",
        });
    };
    const a = await ValidToken(req.body.Token);
    if(a){
        main(a).catch(()=>{
            return res.status(500).json({
                Status: "Error",
                Message: "Internal server error",
            });
        });
    }else{
        return res.status(403).json({
            Status: "Error",
            Message: "Unauthorized access, please login and try again later.",
        });

    }
});
// Search for a Journal
User.post("/journal/search", async (req, res) => {
    function findMatchingObjects(sentence, objectsArray) {
        function isPercentageSame(s1, s2, percentage) {
            const lengthToCompare = Math.floor(s2.length * (percentage / 100));
            return s1.substring(0, lengthToCompare) === s2.substring(0, lengthToCompare);
        };
        const matchedObjects = objectsArray.filter(obj => isPercentageSame(sentence, obj.Title, 40));
        return matchedObjects.length > 0 ? matchedObjects : null;
    };
    async function main(CheckedUser){
        const Title = req.body.Title;
        let Journals = CheckedUser.Journals;
        for (let i = 0; i < Journals.length; i++) {
            const element = Journals[i];
            if (element.Title.toLowerCase().trim() == Title.toLowerCase()) {
                return res.status(200).json({
                    Status: "Success",
                    Matched: "100%",
                    Journal: element,
                });
            };
        };
        const Found = findMatchingObjects(Title, Journals);
        if (Found) {
            return res.status(200).json({
                Status: "Success",
                Matched: "40%",
                Journals: Found,
            });
        };
        return res.status(404).json({
            Status: "Error",
            Message: "Journals not found",
        });
    };
    const a = await ValidToken(req.body.Token);
    if(a){
        main(a).catch(e=>{
            return res.status(500).json({
                Status: "Error",
                Message: "Internal server error",
            });
        });
    }else{
        return res.status(403).json({
            Status: "Error",
            Message: "Unauthorized access, please login and try again later.",
        });

    }
});
// Get profile
User.post("/profile", async (req, res) => {
    async function main(CheckedUser){
        return res.status(200).json({
            Status: "Success",
            User: CheckedUser,
        });
    };
    const a = await ValidToken(req.body.Token);
    if(a){
        main(a).catch(()=>{
            return res.status(500).json({
                Status: "Error",
                Message: "Internal server error",
            });
        });
    }else{
        return res.status(403).json({
            Status: "Error",
            Message: "Unauthorized access, please login and try again later.",
        });

    }
});

User.post("/logout", async (req, res) => {
    async function main(CheckedUser){

        await Users.updateOne({_id: CheckedUser._id}, {
            $set: {
                "Authentication.Token": "",
                "Authentication.Date": new Date()
            }
        }).then(()=>{
            return res.status(200).json({
                Status: "Success",
                Message: "User logged out",
            });
        }).catch(()=>{
            return res.status(500).json({
                Status: "Error",
                Message: "Internal server error",
            });
        });
    };
    const a = await ValidToken(req.body.Token);
    if(a){
        main(a).catch(()=>{
            return res.status(500).json({
                Status: "Error",
                Message: "Internal server error",
            });
        });
    }else{
        return res.status(403).json({
            Status: "Error",
            Message: "Unauthorized access, please login and try again later.",
        });
    };
});
// Delete a Journal
User.post("/journal/delete/:id", async (req, res) => {
    async function main(CheckedUser){
        const id = req.params.id;
        let Journals = CheckedUser.Journals;
        let New_Journals = [];
        let found = false;
        for (let i = 0; i < Journals.length; i++) {
            const element = Journals[i];
            if (element.ID != id) {
                found = true;
                New_Journals.push(element);
            };
        };
        if(found){
            await Users.updateOne({_id: CheckedUser._id}, {
                Journals: New_Journals,
            }).then(()=>{
                return res.status(200).json({
                    Status: "Success",
                    Message: "Journal deleted successfully",
                });
            }).catch(()=>{
                return res.status(500).json({
                    Status: "Error",
                    Message: "Internal server error",
                });
            });
        }else{
            return res.status(404).json({
                Status: "Error",
                Message: "Journal ID not Found.",
            });
        };
    };
    const a = await ValidToken(req.body.Token);
    if(a){
        main(a).catch(()=>{
            return res.status(500).json({
                Status: "Error",
                Message: "Internal server error",
            });
        });
    }else{
        return res.status(403).json({
            Status: "Error",
            Message: "Unauthorized access, please login and try again later.",
        });
    };
});
// If route is not found
User.get("*", (req, res) => {
    res.status(404).json({
        Status: "Error",
        Message: "Route not found",
    });
});



const checkUserMiddleware = async (req, res, next) => {
    try {

        if (!req.body.Token) {
            return res.status(400).json({
                Status: "Error",
                Message: "Token is required",
            });
        }
        const user = await ValidToken(req.body.Token);
        if(!user) {
            return res.status(403).json({
                Status: "Error",
                Message: "Unauthorized access, please login and try again later.",
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({
            Status: "Error",
            message: "Internal server error",
        });
    }
}

User.post("/group/create", checkUserMiddleware , group.createGroup);
User.post("/group/all", checkUserMiddleware , group.getAllGroups);
User.post("/group/users", checkUserMiddleware , group.getAllUsersGroups);
User.post("/group/active", checkUserMiddleware , group.activeGroup);
User.post("/group/owner", checkUserMiddleware , group.ownerGroup);
User.post("/group/join", checkUserMiddleware , group.joinAGroup);
User.delete("/group/end", checkUserMiddleware , group.endGroup);
User.patch("/user/redeem", checkUserMiddleware , group.redeem);
