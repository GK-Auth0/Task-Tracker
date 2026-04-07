import {
  BelongsTo,
  BeforeValidate,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Project from "./project";
import User from "./user";
import Task from "./task";
import Sprint from "./sprint";

export const generateDefectReferenceCode = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DEF-${timePart}${randomPart}`;
};

@Table({
  tableName: "defects",
  timestamps: true,
})
export default class Defect extends Model {
  @BeforeValidate
  static ensureReferenceCode(instance: Defect) {
    if (!instance.reference_code) {
      instance.reference_code = generateDefectReferenceCode();
    }
  }

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  reference_code!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description!: string;

  @Default([])
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  reproduction_steps!: string[];

  @Column({
    type: DataType.ENUM("Critical", "High", "Medium", "Low"),
    allowNull: false,
  })
  severity!: "Critical" | "High" | "Medium" | "Low";

  @Column({
    type: DataType.ENUM("Critical", "High", "Medium", "Low"),
    allowNull: false,
  })
  priority!: "Critical" | "High" | "Medium" | "Low";

  @Column({
    type: DataType.ENUM("Open", "Approved", "Rejected", "In Progress", "Resolved"),
    allowNull: false,
    defaultValue: "Open",
  })
  status!: "Open" | "Approved" | "Rejected" | "In Progress" | "Resolved";

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  project_id!: string;

  @ForeignKey(() => Task)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  linked_task_id?: string;

  @ForeignKey(() => Task)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  created_task_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  creator_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  assignee_id?: string;

  @ForeignKey(() => Sprint)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  sprint_id?: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  sprint_name?: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  linked_run?: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  linked_case?: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  environment?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  rejection_reason?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  approved_at?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  approved_by?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  rejected_at?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  rejected_by?: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @BelongsTo(() => Project, "project_id")
  project!: Project;

  @BelongsTo(() => User, "creator_id")
  creator!: User;

  @BelongsTo(() => User, "assignee_id")
  assignee?: User;

  @BelongsTo(() => Sprint, "sprint_id")
  sprint?: Sprint;

  @BelongsTo(() => Task, "linked_task_id")
  linked_task?: Task;

  @BelongsTo(() => Task, "created_task_id")
  created_task?: Task;

  @BelongsTo(() => User, "approved_by")
  approver?: User;

  @BelongsTo(() => User, "rejected_by")
  rejector?: User;
}
