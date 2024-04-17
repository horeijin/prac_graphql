import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CutVote } from './CutVote';

@ObjectType()
@Entity()
export default class User extends BaseEntity {
  @Field(() => Int) //graphql 필드
  @PrimaryGeneratedColumn() //db 테이블 컬럼
  id!: number;

  @Field({ description: '유저 이름' })
  @Column({ comment: '유저 이름' })
  username: string;

  @Field({ description: '유저 이메일' })
  @Column({ unique: true, comment: '유저 이메일' })
  email: string;

  @Column({ comment: '비밀번호' })
  password: string;

  @Field(() => String, { description: '생성 일자' })
  @CreateDateColumn({ comment: '생성 일자' })
  createdAt: Date;

  @Field(() => String, { description: '업데이트 일자' })
  @UpdateDateColumn({ comment: '업데이트 일자' })
  updatedAt: Date;

  //하나의 유저는 여러 개의 좋아요를 할 수 있다.
  @OneToMany(() => CutVote, (cutVote) => cutVote.user)
  cutVotes: CutVote[];
}
