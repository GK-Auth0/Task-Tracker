import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey, BelongsTo, HasMany, CreatedAt } from "sequelize-typescript";
import { User } from "./index";
import { Task } from "./index";

@Table({
  tableName: "projects",
  timestamps: false,
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  owner_id!: string;

  @Column({
    type: DataType.ENUM("Active", "Archived"),
    allowNull: false,
    defaultValue: "Active",
  })
  status!: "Active" | "Archived";

  @CreatedAt
  created_at!: Date;

  @BelongsTo(() => User, "owner_id")
  owner!: User;

  @HasMany(() => Task, "project_id")
  tasks!: Task[];
}