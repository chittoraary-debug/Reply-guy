import { 
  users, recordings, likes,
  type User, type InsertUser, 
  type Recording, type InsertRecording,
  type Like, type InsertLike
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  createUser(avatarSeed?: string): Promise<User>;
  getUser(id: string): Promise<User | undefined>;

  // Recordings
  createRecording(recording: InsertRecording): Promise<Recording>;
  getRecordings(mood?: string, sort?: 'latest' | 'popular'): Promise<Recording[]>;
  getRecording(id: number): Promise<Recording | undefined>;
  getRandomRecording(): Promise<Recording | undefined>;
  
  // Likes
  toggleLike(recordingId: number, userId: string): Promise<{ success: boolean, likesCount: number }>;
  getLike(recordingId: number, userId: string): Promise<Like | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createUser(avatarSeed?: string): Promise<User> {
    const id = randomUUID();
    const seed = avatarSeed || Math.random().toString(36).substring(7);
    const [user] = await db.insert(users).values({ id, avatarSeed: seed }).returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    const [recording] = await db.insert(recordings).values(insertRecording).returning();
    return recording;
  }

  async getRecordings(mood?: string, sort: 'latest' | 'popular' = 'latest'): Promise<Recording[]> {
    let query = db.select().from(recordings);

    if (mood && mood !== 'All') {
      query = query.where(eq(recordings.mood, mood)) as any;
    }

    if (sort === 'popular') {
      query = query.orderBy(desc(recordings.likesCount));
    } else {
      query = query.orderBy(desc(recordings.createdAt));
    }

    return await query;
  }

  async getRecording(id: number): Promise<Recording | undefined> {
    const [recording] = await db.select().from(recordings).where(eq(recordings.id, id));
    return recording;
  }

  async getRandomRecording(): Promise<Recording | undefined> {
    // Basic random implementation using SQL random
    const [recording] = await db.select()
      .from(recordings)
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return recording;
  }

  async toggleLike(recordingId: number, userId: string): Promise<{ success: boolean, likesCount: number }> {
    const existingLike = await this.getLike(recordingId, userId);
    
    let success = false;
    
    if (existingLike) {
      // Unlike
      await db.delete(likes).where(eq(likes.id, existingLike.id));
      await db.update(recordings)
        .set({ likesCount: sql`${recordings.likesCount} - 1` })
        .where(eq(recordings.id, recordingId));
      success = true;
    } else {
      // Like
      await db.insert(likes).values({ recordingId, userId });
      await db.update(recordings)
        .set({ likesCount: sql`${recordings.likesCount} + 1` })
        .where(eq(recordings.id, recordingId));
      success = true;
    }

    const updatedRecording = await this.getRecording(recordingId);
    return { success, likesCount: updatedRecording?.likesCount ?? 0 };
  }

  async getLike(recordingId: number, userId: string): Promise<Like | undefined> {
    const [like] = await db.select()
      .from(likes)
      .where(and(eq(likes.recordingId, recordingId), eq(likes.userId, userId)));
    return like;
  }
}

export const storage = new DatabaseStorage();
