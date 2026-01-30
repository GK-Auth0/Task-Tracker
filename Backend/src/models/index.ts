import User from "./user";
import Project from "./project";
import ProjectMember from "./ProjectMember";
import ProjectFile from "./ProjectFile";
import Task from "./task";
import Subtask from "./subtask";
import Comment from "./comment";
import Label from "./label";
import TaskLabel from "./taskLabel";

const models = [User, Project, ProjectMember, ProjectFile, Task, Subtask, Comment, Label, TaskLabel];

export default models;

export { User, Project, ProjectMember, ProjectFile, Task, Subtask, Comment, Label, TaskLabel };
