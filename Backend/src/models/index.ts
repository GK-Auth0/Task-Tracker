import User from "./user";
import Project from "./project";
import ProjectMember from "./ProjectMember";
import ProjectFile from "./ProjectFile";
import Task from "./task";
import Subtask from "./subtask";
import Comment from "./comment";
import Label from "./label";
import TaskLabel from "./taskLabel";
import { PullRequest } from "./pullRequest";
import { Commit } from "./commit";
import UserMetadata from "./userMetadata";
import AuthOtp from "./authOtp";
import AuthPasswordReset from "./authPasswordReset";
import AuditLog from "./auditLog";
import ChatGroup from "./chatGroup";
import ChatMessage from "./chatMessage";
import ChatGroupMember from "./chatGroupMember";
import ChatMessageRead from "./chatMessageRead";
import UserPinnedItem from "./userPinnedItem";
import UserSavedView from "./userSavedView";
import UserInvitation from "./userInvitation";
import ProjectConfidentialAccessRequest from "./projectConfidentialAccessRequest";

const models = [User, Project, ProjectMember, ProjectFile, Task, Subtask, Comment, Label, TaskLabel, PullRequest, Commit, UserMetadata, AuthOtp, AuthPasswordReset, AuditLog, ChatGroup, ChatMessage, ChatGroupMember, ChatMessageRead, UserPinnedItem, UserSavedView, UserInvitation, ProjectConfidentialAccessRequest];

export default models;

export { User, Project, ProjectMember, ProjectFile, Task, Subtask, Comment, Label, TaskLabel, PullRequest, Commit, UserMetadata, AuthOtp, AuthPasswordReset, AuditLog, ChatGroup, ChatMessage, ChatGroupMember, ChatMessageRead, UserPinnedItem, UserSavedView, UserInvitation, ProjectConfidentialAccessRequest };
