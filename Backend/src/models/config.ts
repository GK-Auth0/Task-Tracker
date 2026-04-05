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
  Unique,
  UpdatedAt,
} from "sequelize-typescript";
import Project from "./project";
import User from "./user";
import Organization from "./organization";
import { ConfidentialAccessScope } from "../enums";

@Table({
  tableName: "config",
  timestamps: true,
})
export default class Config extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  project_id!: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  organization_id!: string;

  @Column({
    type: DataType.ENUM(
      ConfidentialAccessScope.SPECIFIC_USERS,
      ConfidentialAccessScope.ORGANIZATION,
    ),
    allowNull: false,
    defaultValue: ConfidentialAccessScope.SPECIFIC_USERS,
  })
  access_scope!: ConfidentialAccessScope;

  @Default([])
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  allowed_user_ids!: string[];

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  created_by?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  updated_by?: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => Project, "project_id")
  project!: Project;

  @BelongsTo(() => Organization, "organization_id")
  organization!: Organization;

  @BelongsTo(() => User, "created_by")
  creator?: User;

  @BelongsTo(() => User, "updated_by")
  updater?: User;
}
