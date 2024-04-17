import { DataSource } from 'typeorm';
import User from '../entities/User';
import { CutVote } from '../entities/CutVote';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3307,
  database: 'ghibli_grqphql',
  username: 'root',
  password: '1234',
  logging: !(process.env.NODE_ENV === 'production'),
  synchronize: true, // entities에 명시된 내용을 DB에 자동 동기화, 개발 중에 유용하나, 실제 운영 환경에서는 사용을 권장하지 않음
  entities: [User, CutVote], // 엔티티 클래스 명시
});

export const createDB = async (): Promise<DataSource> => {
  try {
    await AppDataSource.initialize();
    console.log("DB 연결 초기화 성공");
    return AppDataSource;
  } catch (error) {
    console.error("DB 연결 초기화 실패 :", error);
    throw error;
  }
};