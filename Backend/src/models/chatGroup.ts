import { Table, Column, Model, DataType, PrimaryKey, Default, CreatedAt, UpdatedAt, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import User from "./user";
import Project from "./project";

interface ChatGroupCreationAttributes {
  name: string;
  description?: string;
  project_id?: string;
  created_by: string;
  is_project_group?: boolean;
}

@Table({
  tableName: "chat_groups",
  timestamps: true,
})
export default class ChatGroup extends Model<ChatGroup, ChatGroupCreationAttributes> {
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

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  project_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  created_by!: string;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  is_project_group!: boolean;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => Project)
  project?: Project;

  @BelongsTo(() => User)
  creator!: User;

  @HasMany(() => require('./chatMessage').default)
  messages!: any[];

  @HasMany(() => require('./chatGroupMember').default)
  members!: any[];
}