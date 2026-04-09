import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Project from "./project";
import User from "./user";
import { ConfidentialAccessState } from "../enums";

@Table({
  tableName: "project_confidential_access_requests",
  timestamps: true,
})
export default class ProjectConfidentialAccessRequest extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  requester_id!: string;

  @Column({
    type: DataType.ENUM(ConfidentialAccessState.PENDING, ConfidentialAccessState.APPROVED, ConfidentialAccessState.REJECTED),
    allowNull: false,
    defaultValue: ConfidentialAccessState.PENDING,
  })
  status!: ConfidentialAccessState;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  reason?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  decision_note?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  requested_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  decided_at?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  decided_by?: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => Project, "project_id")
  project!: Project;

  @BelongsTo(() => User, "requester_id")
  requester!: User;

  @BelongsTo(() => User, "decided_by")
  decider?: User;
}
