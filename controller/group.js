const Model = require('../Models.js');

const createGroup = async (req, res) => {
    try {
        const user = req.user;
        console.log(user);

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

module.exports = {
    createGroup,
    getAllGroups
}