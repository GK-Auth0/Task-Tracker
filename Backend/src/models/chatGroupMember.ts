import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./user";
import ChatGroup from "./chatGroup";

interface ChatGroupMemberCreationAttributes {
  group_id: string;
  user_id: string;
  joined_at?: Date;
}

@Table({
  tableName: "chat_group_members",
  timestamps: false,
})
export default class ChatGroupMember extends Model<ChatGroupMember, ChatGroupMemberCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => ChatGroup)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  group_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id!: string;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  joined_at!: Date;

  @BelongsTo(() => ChatGroup)
  group!: ChatGroup;

  @BelongsTo(() => User)
  user!: User;
}