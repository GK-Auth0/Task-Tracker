import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import User from "./user";
import Project from "./project";

@Table({
  tableName: "project_members",
  timestamps: true,
})
export default class ProjectMember extends Model {
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
  user_id!: string;

  @Column({
    type: DataType.ENUM('owner', 'admin', 'member', 'viewer'),
    allowNull: false,
    defaultValue: 'member',
  })
  role!: 'owner' | 'admin' | 'member' | 'viewer';

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  joined_at!: Date;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => User, "user_id")
  user!: User;

  @BelongsTo(() => Project, "project_id")
  project!: Project;
}