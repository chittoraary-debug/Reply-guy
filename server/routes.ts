import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Object Storage Routes
  registerObjectStorageRoutes(app);

  // Users
  app.post(api.users.create.path, async (req, res) => {
    try {
      const input = api.users.create.input.optional().parse(req.body);
      const user = await storage.createUser(input?.avatarSeed);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  });

  // Recordings
  app.get(api.recordings.list.path, async (req, res) => {
    try {
      const { mood, sort, userId } = req.query;
      const recordings = await storage.getRecordings(
        mood as string,
        sort as 'latest' | 'popular'
      );

      // Enhance with user info and like status
      const enhancedRecordings = await Promise.all(recordings.map(async (rec) => {
        const user = await storage.getUser(rec.userId);
        let isLiked = false;
        if (userId) {
          const like = await storage.getLike(rec.id, userId as string);
          isLiked = !!like;
        }
        return { ...rec, user, isLiked };
      }));

      res.json(enhancedRecordings);
    } catch (error) {
       res.status(500).json({ message: "Failed to fetch recordings" });
    }
  });

  app.get(api.recordings.get.path, async (req, res) => {
    const recording = await storage.getRecording(Number(req.params.id));
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }
    const user = await storage.getUser(recording.userId);
    res.json({ ...recording, user });
  });

  app.get(api.recordings.getRandom.path, async (req, res) => {
    const recording = await storage.getRandomRecording();
    if (!recording) {
      return res.status(404).json({ message: 'No recordings found' });
    }
    const user = await storage.getUser(recording.userId);
    res.json({ ...recording, user });
  });

  app.post(api.recordings.create.path, async (req, res) => {
    try {
      const input = api.recordings.create.input.parse(req.body);
      const recording = await storage.createRecording(input);
      res.status(201).json(recording);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.recordings.like.path, async (req, res) => {
    try {
      const { userId } = req.body;
      const result = await storage.toggleLike(Number(req.params.id), userId);
      res.json(result);
    } catch (error) {
       res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // SEED DATA
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingUsers = await storage.getUser("seed-user-1");
  // Since we use UUIDs and random IDs, just check if ANY recordings exist? 
  // Or force create a specific user ID for seeding.
  // Actually, randomUUID makes it hard to check for specific ID unless we force insert.
  // Let's just create a seed user if we can't find one, or just check recording count.
  const recordings = await storage.getRecordings();
  if (recordings.length === 0) {
    console.log("Seeding database...");
    
    // Create seed users
    const user1 = await storage.createUser("happy-seed");
    const user2 = await storage.createUser("calm-seed");
    
    // Create seed recordings
    // Note: audioUrls are placeholders. In a real app these would be object storage URLs.
    await storage.createRecording({
      userId: user1.id,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Placeholder
      duration: 30,
      mood: "Happy",
    });

    await storage.createRecording({
      userId: user2.id,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", // Placeholder
      duration: 45,
      mood: "Calm",
    });
    
    console.log("Database seeded!");
  }
}
