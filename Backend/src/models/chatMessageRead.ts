import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import ChatMessage from "./chatMessage";
import User from "./user";

@Table({
  tableName: "chat_message_reads",
  timestamps: false,
})
export default class ChatMessageRead extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => ChatMessage)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  message_id!: string;

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
  read_at!: Date;

  @BelongsTo(() => ChatMessage)
  message!: ChatMessage;

  @BelongsTo(() => User)
  user!: User;
}
