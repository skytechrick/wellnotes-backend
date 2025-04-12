const Model = require('../Models.js');

const createGroup = async (req, res) => {
    try {
        const user = req.user;

        const { name , duration , stakeAmount , maximumMember, mininumMember } = req.body;

        if (!name || !duration || !stakeAmount || !maximumMember || !mininumMember) {
            return res.status(400).json({
                status: "error",
                message: "Please fill all the fields"
            });
        }

        const isExist = await Model.group.exists({name});
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
        const groups = await Model.group.find({status: "waiting"}).populate("userId").exec();
        
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

        // console.log(members);

        if (!members) {
            return res.status(404).json({
                status: "error",
                message: "No groups found"
            });
        }
        
        if (!groups) {
            return res.status(404).json({
                status: "error",
                message: "No groups found"
            });
        }
        res.status(200).json({
            status: "success",
            message: "Groups fetched successfully",
            groups: members,
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

module.exports = {
    createGroup,
    getAllGroups,
    getAllUsersGroups,
    joinAGroup,
    activeGroup,
}