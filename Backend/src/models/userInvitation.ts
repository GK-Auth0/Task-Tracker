import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
} from "sequelize-typescript";
import User from "./user";
import Project from "./project";
import Task from "./task";

@Table({
  tableName: "user_invitations",
  timestamps: true,
})
export default class UserInvitation extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.ENUM("project", "task"),
    allowNull: false,
  })
  context_type!: "project" | "task";

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  project_id?: string;

  @ForeignKey(() => Task)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  task_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  invited_by!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  full_name!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  email!: string;

  @Column({
    type: DataType.ENUM("pending", "accepted", "expired", "cancelled"),
    allowNull: false,
    defaultValue: "pending",
  })
  status!: "pending" | "accepted" | "expired" | "cancelled";

  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  invite_token!: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  expires_at!: Date;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => User, "invited_by")
  inviter!: User;
}
