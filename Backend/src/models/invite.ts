import { Table, Column, Model, DataType, PrimaryKey, Default, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./user";

interface InviteCreationAttributes {
  inviter_id: string;
  invitee_email: string;
  invite_code: string;
  org_code?: string;
  temporary_password?: string;
  expires_at?: Date;
}

@Table({
  tableName: "invites",
  timestamps: true,
})
export default class Invite extends Model<Invite, InviteCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  inviter_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  invitee_email!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  invitee_id?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  invite_code!: string;

  @Column({
    type: DataType.STRING(12),
    allowNull: true,
  })
  org_code?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  temporary_password?: string;

  @Default('pending')
  @Column({
    type: DataType.ENUM('pending', 'accepted', 'expired'),
    allowNull: false,
  })
  status!: 'pending' | 'accepted' | 'expired';

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  sent_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  accepted_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  expires_at?: Date;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => User, 'inviter_id')
  inviter!: User;

  @BelongsTo(() => User, 'invitee_id')
  invitee?: User;
}
