const Joi = require("joi");
const bson = require("bson");
const { createResponse, getResultErrors, isEmpty, createModel } = require("../modules/utils");
const mongoConnection = require("../modules/mongoConnection.js");
const { httpCodes, sendResponse } = require("../modules/httpCodes.js");
const {getGroupInternal, isGroupMember, isGroupAdmin, getPollInternal, getUserInternal, isGroupAdminByGroup,
  isGroupUserByGroup, isGroupMemberByGroup
} = require("../modules/modelUtils");
const {objectID} = require("../modules/validatorUtils");

const validators = {
  name: Joi.string().min(3).max(30),
  description: Joi.string().min(3).max(30),
};

const groupSchema = {
  Name: "",
  Description: "",
  Admins: [],
  Polls: [],
  Members: [],
};

const groupParamsValidator = Joi.object({
  id: Joi.custom(objectID).required(),
});

const createGroupValidator = Joi.object({
  name: validators.name.required(),
  description: validators.description.required(),
});

const editGroupValidator = Joi.object({
  name: validators.name,
  description: validators.description,
});

const getGroup = async function(groupID, userID) {
  try {
    const group = await getGroupInternal(groupID);
    if (!group) { return httpCodes.NotFound(); }

    let isMember = isGroupMemberByGroup(group, userID);
    let isAdmin = isGroupAdminByGroup(group, userID);

    return httpCodes.Ok({
      name: group.Name,
      description: group.Description,
      isMember: isMember,
      isAdmin: isAdmin,
    });
  } catch (err) {
    console.error(err);
    return httpCodes.InternalServerError();
  }
};

const createGroup = async function(userID, groupData) {
  try {
    let group = createModel(groupSchema, {
      Name: groupData.name,
      Description: groupData.description,
      Admins: [userID],
    });
    const result = await mongoConnection.getDB().collection("groups").insertOne(group);
    return httpCodes.Ok({
      id: result.insertedId
    });
  } catch (err) {
    console.error(err);
    return httpCodes.InternalServerError();
  }
};

const editGroup = async function(groupID, userID, groupData) {
  try {
    const group = await getGroupInternal(groupID);
    if (!group) { return httpCodes.NotFound(); }

    let isAdmin = isGroupAdminByGroup(group, userID);
    if (!isAdmin) { return httpCodes.Forbidden(); }

    await mongoConnection.getDB().collection("groups").updateOne(
      { _id: group._id },
      { "$set": {
        Name: groupData.name,
        Description: groupData.description,
      }}
    );
    return httpCodes.Ok();
  } catch (err) {
    console.log(err);
    return httpCodes.InternalServerError();
  }
};

const getGroupMembers = async function (groupID, userID) {
  try {
    const group = await getGroupInternal(groupID);
    if (!group) { return httpCodes.NotFound(); }

    let isAdmin = isGroupAdminByGroup(group, userID);
    if (!isAdmin) { return httpCodes.Forbidden(); }

    let members = [];
    for (let groupUserID of group.Members) {
      let user = await getUserInternal(groupUserID);
      members.push({
        id: user._id,
        userName: user.UserName,
      });
    }
    return httpCodes.Ok(members);
  } catch(err) {
    console.log(err);
    return httpCodes.InternalServerError();
  }
};

const getGroupAdmins = async function (groupID, userID) {
  try {
    const group = await getGroupInternal(groupID);
    if (!group) { return httpCodes.NotFound(); }

    let isAdmin = isGroupAdminByGroup(group, userID);
    if (!isAdmin) { return httpCodes.Forbidden(); }

    let admins = [];
    for (let groupAdminID of group.Admins) {
      let admin = await getUserInternal(groupAdminID);
      admins.push({
        id: admin._id,
        userName: admin.UserName,
      });
    }
    return httpCodes.Ok(admins);
  } catch(err) {
    console.log(err);
    return httpCodes.InternalServerError();
  }
};

const getGroupPolls = async function (userID, groupID) {
  try {
    const group = await getGroupInternal(groupID);
    if (!group) { return httpCodes.NotFound(); }

    const isUser = isGroupUserByGroup(group, userID);
    if (!isUser) { return httpCodes.Forbidden(); }

    const isAdmin = isGroupAdminByGroup(group, userID);

    let polls = [];
    for (let pollID of group.Polls) {
      let poll = await getPollInternal(pollID);
      if (isAdmin || Date.now() > poll.OpenTime && Date.now() < poll.CloseTime) {
        polls.push({
          id: poll._id,
          title: poll.Title,
        });
      }
    }
    return httpCodes.Ok(polls);
  } catch(err) {
    console.log(err);
    return httpCodes.InternalServerError();
  }
};

const joinGroup = async function (groupID, userID) {
  try {
    const group = await getGroupInternal(groupID);
    if (!group) { return httpCodes.NotFound(); }

    const isUser = isGroupUserByGroup(group, userID);
    if (isUser) { return httpCodes.Forbidden(); }

    await mongoConnection.getDB().collection("groups").updateOne(
      {_id: group._id,},
      {
        "$addToSet": {
          "Members": userID,
        }
      }
    );
    return httpCodes.Ok();
  } catch(err) {
    console.log(err);
    return httpCodes.InternalServerError();
  }
};

const leaveGroup = async function (groupID, userID) {
  try {
    let group = await getGroupInternal(groupID);
    if (!group) { return httpCodes.NotFound(); }

    const isMember = isGroupMemberByGroup(group, userID);
    if (!isMember) { return httpCodes.Forbidden(); }

    await mongoConnection.getDB().collection("groups").updateOne(
      { _id: group._id, },
      {"$pull": {
        "Members": userID,
      }}
    );
    return httpCodes.Ok();
  } catch(err) {
    console.log(err);
    return httpCodes.InternalServerError();
  }
};

const deleteGroup = async function (groupID, userID) {
  try {
    let group = await getGroupInternal(groupID);
    if (!group) { return httpCodes.NotFound(); }

    let isAdmin = isGroupAdminByGroup(group, userID);
    if (!isAdmin) { return httpCodes.Forbidden(); }

    await mongoConnection.getDB().collection("groups").deleteOne({ _id: group._id });
    return httpCodes.Ok();
  } catch(err) {
    console.log(err);
    return httpCodes.InternalServerError();
  }
};

module.exports = {
  createGroupValidator,
  groupSchema,
  getGroup,
  createGroup,
  getGroupMembers,
  getGroupAdmins,
  getGroupPolls,
  joinGroup,
  leaveGroup,
  deleteGroup,
  editGroup,
  editGroupValidator,
  groupParamsValidator
};
