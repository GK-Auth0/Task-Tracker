import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import Task from './task';
import User from './user';

@Table({
  tableName: 'task_assignees',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['task_id', 'user_id'],
    },
  ],
})
export default class TaskAssignee extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Task)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  task_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id!: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  assigned_at!: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  assigned_by?: string;

  @BelongsTo(() => Task)
  task!: Task;

  @BelongsTo(() => User, 'user_id')
  user!: User;

  @BelongsTo(() => User, 'assigned_by')
  assignedBy?: User;
}