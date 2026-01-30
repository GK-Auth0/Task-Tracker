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
  HasMany,
  ForeignKey,
} from "sequelize-typescript";
import User from "./user";
import ProjectMember from "./ProjectMember";

@Table({
  tableName: "projects",
  timestamps: true,
})
export default class Project extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled', 'Active', 'Archived'),
    allowNull: false,
    defaultValue: 'planning',
  })
  status!: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'Active' | 'Archived';

  @Column({
    type: DataType.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
  })
  priority!: 'low' | 'medium' | 'high';

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  start_date?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  end_date?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  owner_id!: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => User, "owner_id")
  owner!: User;

  @HasMany(() => ProjectMember, "project_id")
  members!: ProjectMember[];
}