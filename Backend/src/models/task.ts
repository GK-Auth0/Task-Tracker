import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import { User, Project, Subtask, Comment, Label, TaskLabel, TaskFile } from "./index";
import Sprint from "./sprint";
import { TASK_STATUSES, type TaskStatusValue } from "../utils/taskStatus";
import { TaskStatus } from "../enums";

@Table({
  tableName: "tasks",
  timestamps: true,
})
export default class Task extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  project_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description!: string;

  @Column({
    type: DataType.ENUM(...TASK_STATUSES),
    allowNull: false,
    defaultValue: TaskStatus.TODO,
  })
  status!: TaskStatusValue;

  @Column({
    type: DataType.ENUM("Low", "Medium", "High"),
    allowNull: false,
    defaultValue: "Medium",
  })
  priority!: "Low" | "Medium" | "High";

  @Column({
    type: DataType.ENUM("Story", "Task", "Bug"),
    allowNull: false,
    defaultValue: "Task",
  })
  issue_type!: "Story" | "Task" | "Bug";

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  start_date?: Date;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  due_date?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  creator_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  assignee_id?: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  defect_id?: string;

  @ForeignKey(() => Sprint)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  sprint_id?: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => Project, "project_id")
  project!: Project;

  @BelongsTo(() => User, "creator_id")
  creator!: User;

  @BelongsTo(() => User, "assignee_id")
  assignee?: User;

  @BelongsTo(() => Sprint, "sprint_id")
  sprint?: Sprint;

  @HasMany(() => Subtask, "task_id")
  subtasks!: Subtask[];

  @HasMany(() => Comment, "task_id")
  comments!: Comment[];

  @HasMany(() => TaskFile, "task_id")
  attachments!: TaskFile[];

  @BelongsToMany(() => Label, () => TaskLabel)
  labels!: Label[];
}
