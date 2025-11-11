import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Newsletter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;
}
