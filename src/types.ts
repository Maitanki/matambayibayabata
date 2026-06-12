/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  id: string;
  username: string; // unique
  email: string; // unique
  name: string;
  passwordHash: string;
  recoveryPin: string; // simple recovery pin
  role: UserRole;
  reputation: number; // karma points
  createdAt: string;
  avatarUrl?: string;
  bio?: string;
  interests?: string[];
}

export interface Question {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorReputation: number;
  upvotes: string[]; // list of userIds
  downvotes: string[]; // list of userIds
  votesCount: number;
  bestAnswerId?: string; // id of best answer
  answersCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  body: string;
  authorId: string;
  authorName: string;
  authorReputation: number;
  upvotes: string[]; // list of userIds
  downvotes: string[]; // list of userIds
  votesCount: number;
  isBest: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  parentId: string; // questionId or answerId
  parentType: 'question' | 'answer';
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  type: 'answer' | 'followed_topic';
  questionId: string;
  questionTitle: string;
  topic?: string;
  isRead: boolean;
  createdAt: string;
}

export interface dbSchema {
  users: User[];
  questions: Question[];
  answers: Answer[];
  comments: Comment[];
  notifications?: AppNotification[];
}
