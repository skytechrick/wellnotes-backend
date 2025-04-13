const Model = require('../Models.js');

const createGroup = async (req, res) => {
    try {
        const user = req.user;

        const { name, duration, stakeAmount, maximumMember, mininumMember } = req.body;

        if (!name || !duration || !stakeAmount || !maximumMember || !mininumMember) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields"
            });
        }

        const isExist = await Model.group.exists({ name });
        if (isExist) {
            return res.status(400).json({
                status: "error",
                message: "Group name already exists"
            });
        }

        const group = new Model.group({
            userId: user._id,
            status: "waiting",
            name,
            duration,
            stakeAmount,
            maximumMember,
            mininumMember,
            members: [user._id],
        });

        await group.save();
        const groupId = group._id;

        user.groups.push(groupId);
        await user.save();

        res.status(201).json({
            status: "success",
            message: "Group created successfully",
            group: group,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}


// export default createGroup;

const getAllGroups = async (req, res) => {
    try {
        const user = req.user;
        const groups = await Model.group.find({ status: "waiting" }).populate("userId").exec();

        if (!groups) {
            return res.status(404).json({
                status: "error",
                message: "No groups found"
            });
        }
        res.status(200).json({
            status: "success",
            message: "Groups fetched successfully",
            groups
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}

const getAllUsersGroups = async (req, res) => {
    try {
        const user = req.user;
        const groups = await Model.group.find({
            status: {
                $in: ["waiting", "active"]
            }
        }).populate("userId").exec();


        const members = groups.filter((group) => {
            const allMembers = group.members;
            const isMember = allMembers.includes(user._id);
            return isMember;
        }
        );

        if (!members) {
            return res.status(404).json({
                status: "error",
                message: "No groups found"
            });
        }

        const currentStrike = user.strike;

        const currentDate = new Date();
        const A = [];

        members.forEach(group => {


            if (group.status === "active") {
                // console.log(group);

                const d = new Date(currentDate).toISOString().split('T')[0];

                const t = new Date(group.startingDate).toISOString().split('T')[0];

                const dateDiff = ((new Date(d) - new Date(t)) / (1000 * 60 * 60 * 24)) === 0 ? 1 : ((new Date(d) - new Date(t)) / (1000 * 60 * 60 * 24));


                // group.groupStrike = dateDiff>= currentStrike? currentStrike: dateDiff;
                // group.totalDays = dateDiff;

                A.push({
                    ...group.toObject?.() ?? group,
                    groupStrike: currentStrike > 0 ? Math.min(currentStrike, dateDiff) : 0,
                    totalDays: dateDiff
                })


                /* 

                    case 1: 
                            when s is 10
                            when d is 5
                            then groupStrike = 5
                    case 2: 
                            when s is 10
                            when d is 15
                            then groupStrike = 10
                    case 3: 
                            when s is 10
                            when d is 1
                            then groupStrike = 1
                    case 4: 
                            when s is 0
                            when d is 5
                            then groupStrike = 0
                    case 5: 
                            when s is 5
                            when d is 5
                            then groupStrike = 5
                
                */

            } else {

                A.push({
                    ...group.toObject?.() ?? group,
                    groupStrike: 0,
                    totalDays: 0
                });
            }

        })






        if (!groups) {
            return res.status(404).json({
                status: "error",
                message: "No groups found"
            });
        }
        res.status(200).json({
            status: "success",
            message: "Groups fetched successfully",
            groups: A,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}


const joinAGroup = async (req, res) => {
    try {

        const user = req.user;
        const { groupId } = req.body;
        if (!groupId) {
            return res.status(400).json({
                status: "error",
                message: "Please provide groupId"
            });
        }

        const isExist = await Model.group.findOne({
            _id: groupId,
            status: "waiting",
        });

        if (!isExist) {
            return res.status(404).json({
                status: "error",
                message: "Group with status waiting not found"
            });
        }

        const allMembers = isExist.members;

        const maximumMember = isExist.maximumMember;
        const currentMember = allMembers.length;
        if (currentMember >= maximumMember) {
            return res.status(400).json({
                status: "error",
                message: "Group is full"
            });
        }

        const isAlreadyMember = allMembers.includes(user._id);

        if (isAlreadyMember) {
            return res.status(400).json({
                status: "error",
                message: "You are already a member of this group"
            });
        }

        const stakeAmount = isExist.stakeAmount;
        const userBalance = user.Tokens_Earned;

        if (userBalance < stakeAmount) {
            return res.status(400).json({
                status: "error",
                message: "You don't have enough balance to join this group"
            });
        }

        allMembers.push(user._id);

        const updatedGroup = await Model.group.findByIdAndUpdate(
            groupId,
            {
                members: allMembers,
            },
            { new: true }
        );

        user.Tokens_Earned = userBalance - stakeAmount;
        user.groups.push(groupId);
        await user.save();
        res.status(200).json({
            status: "success",
            message: "Group joined successfully",
            group: updatedGroup
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

const activeGroup = async (req, res) => {
    try {

        const user = req.user;
        const { groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({
                status: "error",
                message: "Please provide groupId"
            });
        }

        const isExist = await Model.group.findOne({
            _id: groupId,
            userId: user._id,
            status: "waiting",
        });

        if (!isExist) {
            return res.status(404).json({
                status: "error",
                message: "Group with status waiting created by you is not found"
            });
        }

        const updatedGroup = await Model.group.findByIdAndUpdate(
            groupId,
            {
                startingDate: new Date(),
                status: "active",
            },
            { new: true }
        );

        res.status(200).json({
            status: "success",
            message: "Group activated successfully",
            group: updatedGroup
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}

const endGroup = async (req, res) => {
    try {
        const user = req.user;
        const { groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({
                status: "error",
                message: "Please provide groupId"
            });
        }

        const isExist = await Model.group.findOne({
            _id: groupId,
            userId: user._id,
            status: "active",
        }).populate("members").exec();

        if (!isExist) {
            return res.status(404).json({
                status: "error",
                message: "Group with status active created by you is not found"
            });
        }

        const group = isExist;

        if (group.status !== "active") {

            return res.status(400).json({
                status: "error",
                message: "Group is not active"
            });
        }

        const d = new Date().toISOString().split('T')[0];

        const t = new Date(group.startingDate).toISOString().split('T')[0];

        const dateDiff = ((new Date(d) - new Date(t)) / (1000 * 60 * 60 * 24)) === 0 ? 1 : ((new Date(d) - new Date(t)) / (1000 * 60 * 60 * 24));

        console.log(dateDiff)

        // group.groupStrike = dateDiff>= currentStrike? currentStrike: dateDiff;
        // group.totalDays = dateDiff;


        const allMembers = group.members;




        let gt = [];


        // console.log(allMembers);

        allMembers.forEach(member => {

            const user = member._id;
            const userStrike = member.strike;

            if (userStrike > 0) {
                const userGroupStrike = Math.min(userStrike, dateDiff);
                gt.push({
                    ...member.toObject?.() ?? member,
                    userGroupStrike,
                });
            } else {
                gt.push({
                    ...member,
                    userGroupStrike: 0,
                });
            }

        });


        let sortedMembers = gt.sort((a, b) => {
            return b.userGroupStrike - a.userGroupStrike;
        });

        // console.log(sortedMembers);



        let winners = [];
        let strikeRanks = new Set();

        for (let member of sortedMembers) {

            strikeRanks.add(member.userGroupStrike);

            winners.push(member);

            if (strikeRanks.size === 3) break;
        }


        const totalMembers = sortedMembers.length;
        const totalAmount = group.stakeAmount * totalMembers;

        const totalWinners = winners.length;
        const totalWinnersAmount = totalAmount / totalWinners;


        const winnersWithAmountPromise = winners.map(async (winner) => {

            await Model.Users.findByIdAndUpdate(
                winner._id,
                {
                    Tokens_Earned: winner.Tokens_Earned + totalWinnersAmount,
                    $pull: { groups: groupId },
                    $push: {
                        Journals: {
                            ID: new Date().getTime(),
                            Title: "Group Ended",
                            Description: `You have earned ${totalWinnersAmount} tokens from group ${group.name}`,
                        },
                    },
                },
                { new: true }
            );

            return {
                winnerId: winner._id,
                Tokens_Earned: totalWinnersAmount,
            };
        });

        const winnersWithAmount = await Promise.all(winnersWithAmountPromise);

        const updatedGroup = await Model.group.findByIdAndUpdate(
            groupId,
            {
                status: "closed",
                winners: winnersWithAmount,
                members: [],
            },
            { new: true }
        );

        res.status(200).json({
            status: "success",
            message: "Group ended successfully",
            group: updatedGroup,
            winners: winnersWithAmount,
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}

const redeem = async (req, res) => {
    try {

        const user = req.user;

        const strike = user.strike;

        if (strike < 7) {
            return res.status(400).json({
                status: "error",
                message: "You need to have at least 7 days of strike to redeem"
            });
        }

        const chain = "solana";
        const env = "staging";
        let recipient = "";

        if(req.body.email && user.redeemStrike.email === false){
            recipientAddress = `email:${recipientEmail}:${chain}`;
            user.redeemStrike.email = true;
        }else if( req.body.walletAddress && user.redeemStrike.wallet === false){
            user.redeemStrike.wallet = true;
            
            recipient = `${chain}:${recipientWallet}`;

        }else{
            return res.status(400).json({
                status: "error",
                message: "Please provide either email or wallet address where you have not redeemed yet"
            });
        }

        const apiKey = process.env.CROSSMINT_API_KEY;

        const url = `https://${env}.crossmint.com/api/2022-06-09/collections/default/nfts`;

        fetch(url, {
            method: "POST",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify({
                recipient,
                metadata: {
                    name: "Crossmint Test NFT",
                    image: "https://picsum.photos/400",
                    description: "My first NFT using Crossmint",
                },
            }),
        }).then((res) => {
            return res.json();
        }).then(async(json) => {
            await user.save();
            return res.status(200).json({
                status: "success",
                message: "NFT minted successfully",
                data: json
            });
        }).catch((err) =>{
              return res.status(500).json({
                status: "error",
                message: "Internal server error"
            })
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}

const ownerGroup = async (req, res) => {
    try {

        const user = req.user;

        const allUsersGroup = await Model.group.find({
            userId: user._id,
            status: {
                $in: ["waiting", "active"],
            },
        });

        if (allUsersGroup.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No created groups found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Groups fetched successfully",
            groups: allUsersGroup
        });
        
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};


module.exports = {
    createGroup,
    getAllGroups,
    getAllUsersGroups,
    joinAGroup,
    activeGroup,
    endGroup,
    redeem,
    ownerGroup,
}
