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
  tableName: 'pull_requests',
  timestamps: true,
})
export class PullRequest extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.ENUM('open', 'merged', 'closed'),
    allowNull: false,
    defaultValue: 'open',
  })
  status!: 'open' | 'merged' | 'closed';

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  repository!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  branch!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  number!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  author!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  github_url!: string;

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