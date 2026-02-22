import { Table, Column, Model, DataType, PrimaryKey, Default, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./user";
import ChatGroup from "./chatGroup";

interface ChatMessageCreationAttributes {
  group_id: string;
  user_id: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
}

@Table({
  tableName: "chat_messages",
  timestamps: true,
})
export default class ChatMessage extends Model<ChatMessage, ChatMessageCreationAttributes> {
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

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  attachment_url?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  attachment_name?: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => ChatGroup)
  group!: ChatGroup;

  @BelongsTo(() => User)
  user!: User;
}