import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import Task from './task';

@Table({
  tableName: 'commits',
  timestamps: true,
})
export class Commit extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  hash!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  message!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  author_name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  author_avatar!: string;

  @ForeignKey(() => Task)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  task_id!: string;

  @BelongsTo(() => Task)
  task!: Task;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;
}

export default Commit;