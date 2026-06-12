/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { User, Question, Answer, Comment, UserRole } from './src/types';

const app = express();
const PORT = 3000;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

app.use(express.json());

// Helper to Hash passwords securely natively
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

// Initialize server-side firebase instance
let firebaseConfig: any = {};
try {
  const configString = readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8');
  firebaseConfig = JSON.parse(configString);
} catch (err) {
  console.error('Kuskure yayin kokarin loda firebase-applet-config.json:', err);
}

const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Ensure database file and initial high-quality Hausa seeds exist in Firestore
async function initDatabase() {
  try {
    const usersSnapshot = await getDocs(collection(firestoreDb, 'users'));
    if (usersSnapshot.empty) {
      console.log('Fara dora bayanan asali (Seeding) a matsayin Firestore...');
      
      const saltAdmin = hashPassword('admin123');
      const saltUser1 = hashPassword('user123');
      const saltUser2 = hashPassword('user123');
      const saltUser3 = hashPassword('user123');

      const initialUsers: User[] = [
        {
          id: 'admin_id',
          username: 'Sarkin_Tattaunawa',
          email: 'admin@matambayi.com',
          name: 'Malam Ibrahim',
          passwordHash: saltAdmin,
          recoveryPin: '9999',
          role: UserRole.ADMIN,
          reputation: 150,
          createdAt: new Date().toISOString(),
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80'
        },
        {
          id: 'user1_id',
          username: 'Aliyu_Kano',
          email: 'aliyu@kano.com',
          name: 'Aliyu Mohammad',
          passwordHash: saltUser1,
          recoveryPin: '1111',
          role: UserRole.USER,
          reputation: 25,
          createdAt: new Date().toISOString(),
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80'
        },
        {
          id: 'user2_id',
          username: 'Safiya_Zaria',
          email: 'safiya@zaria.com',
          name: 'Safiya Yusuf',
          passwordHash: saltUser2,
          recoveryPin: '2222',
          role: UserRole.USER,
          reputation: 35,
          createdAt: new Date().toISOString(),
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80'
        },
        {
          id: 'user3_id',
          username: 'Malam_Bala_Funtua',
          email: 'bala@funtua.com',
          name: 'Bala Funtua (Noma)',
          passwordHash: saltUser3,
          recoveryPin: '3333',
          role: UserRole.USER,
          reputation: 80,
          createdAt: new Date().toISOString(),
          avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&q=80'
        }
      ];

      const initialQuestions: Question[] = [
        {
          id: 'q1',
          title: 'Yaya ake magance kwari masu cin ganyen wake da barkono a lokacin damina?',
          body: 'Salama alaikum masu gona. Ina da gonar wake da barkono a kusa da Kano, amma a wannan daminar kwari masu jikin gashi-gashi suna gama cinye ganyen shukokin. Wane irin magani na gida ko na shagon gona zai fi dacewa kuma ba zai cutar da amfanin gonar ba? Na gode da taimako.',
          tags: ['Noma', 'Kwari', 'Taimako'],
          authorId: 'user1_id',
          authorName: 'Aliyu_Kano',
          authorReputation: 25,
          upvotes: ['user2_id', 'user3_id'],
          downvotes: [],
          votesCount: 2,
          bestAnswerId: 'a1',
          answersCount: 1,
          commentsCount: 1,
          createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
        },
        {
          id: 'q2',
          title: 'Mene ne amfanin shan shayin ganyen bishiyar zogale ga lafiya?',
          body: 'Mahaifiyata tana yawan tafasa ganyen zogale tana sha kusan kullum da safe. Tana cewa yana da kyau sosai ga rage hawan jini da rage sikari a jiki. Ina so in tambayi dandalin Matambayi ko akwai cikakken binciken likitanci da ya tabbatar da wannan amfanin gezogen zogale?',
          tags: ['Lafiya', 'Zogale', 'Abinci'],
          authorId: 'user2_id',
          authorName: 'Safiya_Zaria',
          authorReputation: 35,
          upvotes: ['user1_id'],
          downvotes: [],
          votesCount: 1,
          bestAnswerId: undefined,
          answersCount: 1,
          commentsCount: 0,
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          id: 'q3',
          title: 'Mene ne asalin tarihin birnin Kano kuma wanene sarki na farko?',
          body: 'Ina son sanin ainihin tarihin kafuwar birnin Kano da kuma labarin mutumin nan mai suna Bagauda. Shin asalin mutanen birnin Kano na yanzu daga ina suka fito karkashin rubutun tarihin Kano Chronicle?',
          tags: ['Tarihi', 'Kano', 'Al`ada'],
          authorId: 'user1_id',
          authorName: 'Aliyu_Kano',
          authorReputation: 25,
          upvotes: [],
          downvotes: [],
          votesCount: 0,
          bestAnswerId: undefined,
          answersCount: 0,
          commentsCount: 0,
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ];

      const initialAnswers: Answer[] = [
        {
          id: 'a1',
          questionId: 'q1',
          body: 'Zaka iya amfani da garin ganyen bishiyar kirya ko kuma fesa maganin da aka hada da "Neem Oil" (man ridi da bishiyar darbejiya) hade da sabulun salo. Wannan hadin na gargajiya yana korar kwari sosai ba tare da ya bata lafiyar amfanin gonarku ba.\n\nIdan kuma maganin zamani kuke so, zaka iya siyan maganin fesa gona mai dauke da sinadarin Permethrin ko Cypermethrin a kusa da shagon kayan gona a birnin Kano. Amma ka tabbatar ka bar kwana 7-14 bayan fesa maganin kafin girbe barkonon. Allah ya bada albarka!',
          authorId: 'user3_id',
          authorName: 'Malam_Bala_Funtua',
          authorReputation: 80,
          upvotes: ['user1_id', 'user2_id'],
          downvotes: [],
          votesCount: 2,
          isBest: true,
          createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
        },
        {
          id: 'a2',
          questionId: 'q2',
          body: 'Gaskiya ne Safiya! Ganyen zogale (wanda aka sani da Moringa oleifera a turance) yana dauke da sinadarai masu tarin yawa wadanda jiki ke bukata kamar calcium, potassium, da bitamin A da C. \n\nBinciken kimiyya ya tabbatar da cewa yana dauke da sinadaran "Isothiocyanates" wadanda ke taimakawa wajen daidaita hawan jini da kuma taimakawa insulin din jiki wajen rage suga. Saboda haka, abin da mahaifiyarku take yi yana da matukar amfani sosai! Sai dai a tabbatar an wanke ganyen sosai kafin a dafa shi saboda kura ko kwayoyin cuta da ke ganyen.',
          authorId: 'admin_id',
          authorName: 'Sarkin_Tattaunawa',
          authorReputation: 150,
          upvotes: ['user2_id'],
          downvotes: [],
          votesCount: 1,
          isBest: false,
          createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
        }
      ];

      const initialComments: Comment[] = [
        {
          id: 'c1',
          parentId: 'q1',
          parentType: 'question',
          body: 'Wace irin shuka ce ta wake? Gaba daya gonar ce kwari suka shafa ko wasu sashe na gonar ne kawai?',
          authorId: 'user2_id',
          authorName: 'Safiya_Zaria',
          createdAt: new Date(Date.now() - 3600000 * 22).toISOString()
        }
      ];

      for (const u of initialUsers) {
        await setDoc(doc(firestoreDb, 'users', u.id), u);
      }
      for (const q of initialQuestions) {
        await setDoc(doc(firestoreDb, 'questions', q.id), q);
      }
      for (const a of initialAnswers) {
        await setDoc(doc(firestoreDb, 'answers', a.id), a);
      }
      for (const c of initialComments) {
        await setDoc(doc(firestoreDb, 'comments', c.id), c);
      }
    }
  } catch (err) {
    console.error('Kuskure a initDatabase:', err);
  }
}

// Read database helper
async function readDB() {
  try {
    const collectionsToRead = ['users', 'questions', 'answers', 'comments', 'notifications'];
    const results: any = {};
    for (const cName of collectionsToRead) {
      results[cName] = [];
      const colSnapshot = await getDocs(collection(firestoreDb, cName));
      colSnapshot.forEach((docSnap) => {
        results[cName].push({ id: docSnap.id, ...docSnap.data() });
      });
    }
    if (!results.notifications) {
      results.notifications = [];
    }
    return results;
  } catch (err) {
    console.error('Kuskure a readDB:', err);
    return { users: [], questions: [], answers: [], comments: [], notifications: [] };
  }
}

// Write database helper
async function writeDB(data: any) {
  try {
    const collectionsToWrite = ['users', 'questions', 'answers', 'comments', 'notifications'];
    for (const cName of collectionsToWrite) {
      const list = data[cName] || [];
      const currentIds = new Set(list.map((item: any) => item.id).filter(Boolean));
      
      // Look for deletions dynamically to sync perfectly
      const colSnapshot = await getDocs(collection(firestoreDb, cName));
      for (const d of colSnapshot.docs) {
        if (!currentIds.has(d.id)) {
          await deleteDoc(doc(firestoreDb, cName, d.id));
        }
      }

      // Upsert current records
      for (const item of list) {
        if (item.id) {
          const { id, ...saveData } = item;
          // Clean undefined values
          const cleanData: any = {};
          Object.keys(saveData).forEach(key => {
            if (saveData[key] !== undefined) {
              cleanData[key] = saveData[key];
            }
          });
          await setDoc(doc(firestoreDb, cName, item.id), cleanData);
        }
      }
    }
  } catch (err) {
    console.error('Kuskure a writeDB:', err);
  }
}

// Recalculate and update reputation score of a user
async function updateReputation(userId: string) {
  const db = await readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) return;

  let rep = 50; // Starting reputation base (default seed)
  if (user.username === 'Sarkin_Tattaunawa') rep = 150;
  if (user.username === 'Malam_Bala_Funtua') rep = 80;

  // Let's add details
  // +5 for each upvote received on a question
  // -2 for each downvote received on a question
  const userQuestions = db.questions.filter((q: any) => q.authorId === userId);
  userQuestions.forEach((q: any) => {
    rep += (q.upvotes.length * 5);
    rep -= (q.downvotes.length * 2);
  });

  // +10 for each upvote received on an answer
  // -2 for each downvote received on an answer
  // +15 for getting an answer accepted as Best Answer
  const userAnswers = db.answers.filter((a: any) => a.authorId === userId);
  userAnswers.forEach((a: any) => {
    rep += (a.upvotes.length * 10);
    rep -= (a.downvotes.length * 2);
    if (a.isBest) {
      rep += 15;
    }
  });

  user.reputation = rep;
  
  // Update throughout existing databases user info
  db.questions.forEach((q: any) => {
    if (q.authorId === userId) {
      q.authorReputation = rep;
    }
  });
  db.answers.forEach((a: any) => {
    if (a.authorId === userId) {
      a.authorReputation = rep;
    }
  });

  await writeDB(db);
}

// Main server start setup wrapped
async function main() {
  await initDatabase();

  // Authentication API: Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, name, password, recoveryPin } = req.body;
      if (!username || !email || !name || !password || !recoveryPin) {
        return res.status(400).json({ error: 'Duk bayanan da ake bukata basu cika ba. Da fatan a cika duka fannonin.' });
      }

      const db = await readDB();
      const existingUsername = db.users.find((u: any) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (existingUsername) {
        return res.status(400).json({ error: 'Wannan sunan mai amfani (username) ya riga ya kasance a dandalin. Da fatan a zabi wani daban.' });
      }

      const existingEmail = db.users.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (existingEmail) {
        return res.status(400).json({ error: 'Wannan adireshin imel (email) ya riga ya kasance a dandalin. Da fatan a yi amfani da wani daban ko ku shiga asusunku.' });
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        username: username.trim(),
        email: email.trim(),
        name: name.trim(),
        passwordHash: hashPassword(password),
        recoveryPin: recoveryPin.trim(),
        role: UserRole.USER,
        reputation: 50,
        createdAt: new Date().toISOString(),
        bio: '',
        interests: []
      };

      db.users.push(newUser);
      await writeDB(db);

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        reputation: newUser.reputation,
        bio: newUser.bio,
        interests: newUser.interests
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Kuskure ya faru lokacin yin rajista: ' + err.message });
    }
  });

  // Authentication API: Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { credential, password } = req.body; // credential can be email or username
      if (!credential || !password) {
        return res.status(400).json({ error: 'Da fatan a shigar da Suna ko Imel, sannan da kalmar sirri.' });
      }

      const db = await readDB();
      const user = db.users.find((u: any) => 
        u.username.toLowerCase() === credential.toLowerCase() || 
        u.email.toLowerCase() === credential.toLowerCase()
      );

      if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: 'Sunan shiga ko kalmar sirri basu dace ba. Sake dubawa.' });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        reputation: user.reputation,
        avatarUrl: user.avatarUrl,
        bio: user.bio || '',
        interests: user.interests || []
      });
    } catch (err: any) {
      res.status(500).json({ error: 'An sami matsala wajen shiga dandalin: ' + err.message });
    }
  });

  // Authentication API: Recover Password
  app.post('/api/auth/recover', async (req, res) => {
    try {
      const { email, recoveryPin, newPassword } = req.body;
      if (!email || !recoveryPin || !newPassword) {
        return res.status(400).json({ error: 'Da fatan a shigar da imel, lambar sirri ta maido da lafiya (recovery PIN), da sabuwar kalmar sirri.' });
      }

      const db = await readDB();
      const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return res.status(404).json({ error: 'Ba a sami mai amfani mai wannan imel din ba.' });
      }

      if (user.recoveryPin !== recoveryPin.trim()) {
        return res.status(401).json({ error: 'Lambar sirri ta PIN ba ta dace ba.' });
      }

      user.passwordHash = hashPassword(newPassword);
      await writeDB(db);

      res.json({ message: 'An yi nasarar canza kalmar sirrin ku! Yanzu zaku iya shiga.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Matsalar canza kalmar sirri: ' + err.message });
    }
  });

  // API to list and search questions with sorting
  app.get('/api/questions', async (req, res) => {
    try {
      const { search, tag, sort } = req.query;
      const db = await readDB();
      let list = [...db.questions];

      // Filters
      if (search) {
        const query = (search as string).toLowerCase();
        list = list.filter((q: Question) => 
          q.title.toLowerCase().includes(query) || 
          q.body.toLowerCase().includes(query)
        );
      }

      if (tag) {
        const tagQuery = (tag as string).toLowerCase();
        list = list.filter((q: Question) => 
          q.tags.some(t => t.toLowerCase() === tagQuery)
        );
      }

      // Sorting
      if (sort === 'hot') {
        // Sort by votes
        list.sort((a, b) => b.votesCount - a.votesCount);
      } else if (sort === 'answers') {
        // Sort by number of answers
        list.sort((a, b) => b.answersCount - a.answersCount);
      } else {
        // Default: newest
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get specific question detail with its answers and comments
  app.get('/api/questions/:id', async (req, res) => {
    try {
      const db = await readDB();
      const question = db.questions.find((q: Question) => q.id === req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Ba a sami wannan tambayar ba.' });
      }

      const answers = db.answers.filter((a: Answer) => a.questionId === question.id);
      const comments = db.comments.filter((c: Comment) => c.parentId === question.id && c.parentType === 'question');
      
      // Load comments for answers as well
      const answersWithComments = answers.map((ans: Answer) => {
        const ansComments = db.comments.filter((c: Comment) => c.parentId === ans.id && c.parentType === 'answer');
        return {
          ...ans,
          comments: ansComments
        };
      });

      // Ensure answers display best design (validated isBest first, then higher votes)
      answersWithComments.sort((a, b) => {
        if (a.isBest) return -1;
        if (b.isBest) return 1;
        return b.votesCount - a.votesCount;
      });

      res.json({
        ...question,
        comments,
        answers: answersWithComments
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create Question
  app.post('/api/questions', async (req, res) => {
    try {
      const { title, body, tags, userId } = req.body;
      if (!title || !body || !userId) {
        return res.status(400).json({ error: 'Title da bayani na tambaya suna da matukar muhimmanci.' });
      }

      const db = await readDB();
      const user = db.users.find((u: User) => u.id === userId);
      if (!user) {
        return res.status(401).json({ error: 'Zama bai halatta ba kafin shiga dandalin.' });
      }

      const cleanTags = Array.isArray(tags) 
        ? tags.map(t => t.trim().substring(0, 25)).filter(t => t.length > 0)
        : [];

      const newQuestion: Question = {
        id: crypto.randomUUID(),
        title: title.trim(),
        body: body.trim(),
        tags: cleanTags,
        authorId: user.id,
        authorName: user.username,
        authorReputation: user.reputation,
        upvotes: [],
        downvotes: [],
        votesCount: 0,
        createdAt: new Date().toISOString(),
        answersCount: 0,
        commentsCount: 0
      };

      db.questions.push(newQuestion);

      // Generate notifications for other users following topics in this question's tags
      db.users.forEach((u: any) => {
        if (u.id === user.id) return; // exclude author
        
        const userInterests = Array.isArray(u.interests) ? u.interests : [];
        const matchingTopic = cleanTags.find(tag => 
          userInterests.some(interest => interest.trim().toLowerCase() === tag.trim().toLowerCase())
        );

        if (matchingTopic) {
          if (!db.notifications) db.notifications = [];
          db.notifications.push({
            id: crypto.randomUUID(),
            recipientId: u.id,
            senderId: user.id,
            senderName: user.username,
            type: 'followed_topic',
            questionId: newQuestion.id,
            questionTitle: newQuestion.title,
            topic: matchingTopic,
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      });

      await writeDB(db);
      await updateReputation(user.id);

      res.status(201).json(newQuestion);
    } catch (err: any) {
      res.status(500).json({ error: 'An sami matsala wajen wallafa tambayar ku: ' + err.message });
    }
  });

  // Vote Question: upvote or downvote with single state prevention
  app.post('/api/questions/:id/vote', async (req, res) => {
    try {
      const { userId, direction } = req.body; // direction can be 'up' or 'down'
      if (!userId || !direction) {
        return res.status(400).json({ error: 'UserId da kalar maki (up/down) ana bukata.' });
      }

      const db = await readDB();
      const question = db.questions.find((q: Question) => q.id === req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Ba a sami wannan tambayar ba.' });
      }

      // Clear previous vote direction of this user
      question.upvotes = question.upvotes.filter((id: string) => id !== userId);
      question.downvotes = question.downvotes.filter((id: string) => id !== userId);

      if (direction === 'up') {
        question.upvotes.push(userId);
      } else if (direction === 'down') {
        question.downvotes.push(userId);
      }

      question.votesCount = question.upvotes.length - question.downvotes.length;
      await writeDB(db);

      // Trigger reputation recalculations for the question author
      await updateReputation(question.authorId);

      res.json({
        votesCount: question.votesCount,
        upvotes: question.upvotes,
        downvotes: question.downvotes
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete Question: author or admin only
  app.delete('/api/questions/:id', async (req, res) => {
    try {
      const { userId } = req.body;
      const db = await readDB();
      const idx = db.questions.findIndex((q: Question) => q.id === req.params.id);
      
      if (idx === -1) {
        return res.status(404).json({ error: 'Ba a sami wannan tambayar ba.' });
      }

      const question = db.questions[idx];
      const requestingUser = db.users.find((u: User) => u.id === userId);

      if (!requestingUser || (question.authorId !== userId && requestingUser.role !== UserRole.ADMIN)) {
        return res.status(403).json({ error: 'Baka da ikon goge wannan tambayar karkashin ka`idar dandalin.' });
      }

      // Remove question
      db.questions.splice(idx, 1);
      
      // Also delete associated answers and comments to keep db hygienic
      db.answers = db.answers.filter((a: Answer) => a.questionId !== req.params.id);
      db.comments = db.comments.filter((c: Comment) => c.parentId !== req.params.id);

      await writeDB(db);
      await updateReputation(question.authorId);

      res.json({ success: true, message: 'An yi nasarar goge tambaya da duk amsoshinta.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Post Answer to Question
  app.post('/api/questions/:id/answers', async (req, res) => {
    try {
      const { body, userId } = req.body;
      if (!body || !userId) {
        return res.status(400).json({ error: 'Akwai bukatan rubutun amsar ku.' });
      }

      const db = await readDB();
      const question = db.questions.find((q: Question) => q.id === req.params.id);
      if (!question) {
        return res.status(404).json({ error: 'Ba a sami tambayar ba.' });
      }

      const user = db.users.find((u: User) => u.id === userId);
      if (!user) {
        return res.status(401).json({ error: 'Da fatan a shiga dandalin don amsa wannan tambayar.' });
      }

      const newAnswer: Answer = {
        id: crypto.randomUUID(),
        questionId: question.id,
        body: body.trim(),
        authorId: user.id,
        authorName: user.username,
        authorReputation: user.reputation,
        upvotes: [],
        downvotes: [],
        votesCount: 0,
        isBest: false,
        createdAt: new Date().toISOString()
      };

      db.answers.push(newAnswer);
      question.answersCount = (question.answersCount || 0) + 1;

      // Generate notification for question author if the answer is by someone else
      if (question.authorId !== user.id) {
        if (!db.notifications) db.notifications = [];
        db.notifications.push({
          id: crypto.randomUUID(),
          recipientId: question.authorId,
          senderId: user.id,
          senderName: user.username,
          type: 'answer',
          questionId: question.id,
          questionTitle: question.title,
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      await writeDB(db);
      await updateReputation(user.id);

      res.status(201).json(newAnswer);
    } catch (err: any) {
      res.status(500).json({ error: 'Matsalar aika amsa: ' + err.message });
    }
  });

  // Vote Answer
  app.post('/api/questions/:id/answers/:answerId/vote', async (req, res) => {
    try {
      const { userId, direction } = req.body;
      if (!userId || !direction) {
        return res.status(400).json({ error: 'UserId da kalar maki (up/down) ana bukata.' });
      }

      const db = await readDB();
      const answer = db.answers.find((a: Answer) => a.id === req.params.answerId);
      if (!answer) {
        return res.status(404).json({ error: 'Ba a sami wannan amsar ba.' });
      }

      // Swap or delete old vote
      answer.upvotes = answer.upvotes.filter((id: string) => id !== userId);
      answer.downvotes = answer.downvotes.filter((id: string) => id !== userId);

      if (direction === 'up') {
        answer.upvotes.push(userId);
      } else if (direction === 'down') {
        answer.downvotes.push(userId);
      }

      answer.votesCount = answer.upvotes.length - answer.downvotes.length;
      await writeDB(db);

      // Recalculate answer author's reputation
      await updateReputation(answer.authorId);

      res.json({
        votesCount: answer.votesCount,
        upvotes: answer.upvotes,
        downvotes: answer.downvotes
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Accept Answer as Best Solution (Mafi kyawun amsa)
  // Only the creator of the question can choose this.
  app.post('/api/questions/:id/answers/:answerId/best', async (req, res) => {
    try {
      const { userId } = req.body;
      const db = await readDB();
      const question = db.questions.find((q: Question) => q.id === req.params.id);
      
      if (!question) {
        return res.status(404).json({ error: 'Ba a sami wannan tambayar ba.' });
      }

      if (question.authorId !== userId) {
        return res.status(403).json({ error: 'Mai tambayar ne kadai ke da ikon zaben Mafi kyawun amsa.' });
      }

      // Reset any previous "best answer" for this question
      const questionAnswers = db.answers.filter((a: Answer) => a.questionId === question.id);
      const oldBestAuthorId = question.bestAnswerId ? db.answers.find((a: any) => a.id === question.bestAnswerId)?.authorId : null;
      
      questionAnswers.forEach((a: Answer) => {
        a.isBest = (a.id === req.params.answerId);
      });

      question.bestAnswerId = req.params.answerId;
      await writeDB(db);

      // Recalculate reputation for former best answer author (if any) and new best answer author
      const newBestAnswer = db.answers.find((a: Answer) => a.id === req.params.answerId);
      if (newBestAnswer) {
        await updateReputation(newBestAnswer.authorId);
      }
      if (oldBestAuthorId && oldBestAuthorId !== newBestAnswer?.authorId) {
        await updateReputation(oldBestAuthorId);
      }

      res.json({ success: true, bestAnswerId: question.bestAnswerId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Post Comment on Question or Answer
  app.post('/api/comments', async (req, res) => {
    try {
      const { parentId, parentType, body, userId } = req.body;
      if (!parentId || !parentType || !body || !userId) {
        return res.status(400).json({ error: 'Bayanan comment da ake bukata basu cika ba.' });
      }

      const db = await readDB();
      const user = db.users.find((u: User) => u.id === userId);
      if (!user) {
        return res.status(401).json({ error: 'Da fatan a shiga dandalin kafin ku yi ra`ayi.' });
      }

      const newComment: Comment = {
        id: crypto.randomUUID(),
        parentId,
        parentType,
        body: body.trim(),
        authorId: user.id,
        authorName: user.username,
        createdAt: new Date().toISOString()
      };

      db.comments.push(newComment);

      // Increment counters in related question if comments on question
      if (parentType === 'question') {
        const question = db.questions.find((q: Question) => q.id === parentId);
        if (question) {
          question.commentsCount = (question.commentsCount || 0) + 1;
        }
      }

      await writeDB(db);
      res.status(201).json(newComment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get User Profile with their asked questions and given answers
  app.get('/api/users/:username', async (req, res) => {
    try {
      const db = await readDB();
      const user = db.users.find((u: User) => u.username.toLowerCase() === req.params.username.toLowerCase());
      if (!user) {
        return res.status(404).json({ error: 'Ba a sami mai amfani ba.' });
      }

      const questions = db.questions.filter((q: Question) => q.authorId === user.id);
      const answers = db.answers.filter((a: Answer) => a.authorId === user.id);

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        reputation: user.reputation,
        avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
        createdAt: user.createdAt,
        bio: user.bio || '',
        interests: user.interests || [],
        questions,
        answersCount: answers.length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update User Profile API (bio, interests, name, etc.)
  app.put('/api/users/:id', async (req, res) => {
    try {
      const { bio, interests, name, avatarUrl } = req.body;
      const db = await readDB();
      const user = db.users.find((u: User) => u.id === req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Ba a sami wannan mai amfani ba.' });
      }

      if (bio !== undefined) user.bio = bio.trim();
      if (interests !== undefined) {
        user.interests = Array.isArray(interests) 
          ? interests.map((t: string) => t.trim().substring(0, 30)).filter((t: string) => t.length > 0)
          : [];
      }
      if (name !== undefined) user.name = name.trim();
      if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();

      await writeDB(db);

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        reputation: user.reputation,
        avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
        createdAt: user.createdAt,
        bio: user.bio || '',
        interests: user.interests || []
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Kuskure ya faru lokacin sabunta bayanan mai amfani: ' + err.message });
    }
  });

  // Get user notifications
  app.get('/api/users/:id/notifications', async (req, res) => {
    try {
      const db = await readDB();
      const userNotifications = (db.notifications || []).filter((n: any) => n.recipientId === req.params.id);
      
      // Sort newest first
      userNotifications.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(userNotifications);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Mark all notifications for a user as read
  app.post('/api/users/:id/notifications/read-all', async (req, res) => {
    try {
      const db = await readDB();
      if (!db.notifications) db.notifications = [];
      
      db.notifications.forEach((n: any) => {
        if (n.recipientId === req.params.id) {
          n.isRead = true;
        }
      });
      
      await writeDB(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Mark single notification as read
  app.post('/api/users/:id/notifications/:notificationId/read', async (req, res) => {
    try {
      const db = await readDB();
      if (!db.notifications) db.notifications = [];
      
      const notif = db.notifications.find((n: any) => n.id === req.params.notificationId && n.recipientId === req.params.id);
      if (notif) {
        notif.isRead = true;
        await writeDB(db);
      }
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get top active contributors (leaders) by reputation score
  app.get('/api/leaders', async (req, res) => {
    try {
      const db = await readDB();
      const list = [...db.users];
      list.sort((a: any, b: any) => b.reputation - a.reputation);
      const topFive = list.slice(0, 5).map((u: any) => ({
        username: u.username,
        name: u.name,
        reputation: u.reputation,
        avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
        role: u.role
      }));
      res.json(topFive);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Hot Tag counts
  app.get('/api/tags', async (req, res) => {
    try {
      const db = await readDB();
      const tagsMap: Record<string, number> = {};
      
      db.questions.forEach((q: Question) => {
        q.tags.forEach((t: string) => {
          tagsMap[t] = (tagsMap[t] || 0) + 1;
        });
      });

      const tagsList = Object.keys(tagsMap).map(name => ({
        name,
        count: tagsMap[name]
      }));

      // Sort by popularity
      tagsList.sort((a, b) => b.count - a.count);
      res.json(tagsList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin and Moderation: Delete answer, comments or questions directly
  app.delete('/api/admin/questions/:id', async (req, res) => {
    try {
      const { adminId } = req.body;
      const db = await readDB();
      const adminUser = db.users.find((u: User) => u.id === adminId);
      
      if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Baka da ikon gudanarwa ko goge tambaya a dandalin.' });
      }

      db.questions = db.questions.filter((q: Question) => q.id !== req.params.id);
      db.answers = db.answers.filter((a: Answer) => a.questionId !== req.params.id);
      db.comments = db.comments.filter((c: Comment) => c.parentId !== req.params.id);

      await writeDB(db);
      res.json({ success: true, message: 'An goge tambayar cikin nasara ta matsayin Admin.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/answers/:id', async (req, res) => {
    try {
      const { adminId } = req.body;
      const db = await readDB();
      const adminUser = db.users.find((u: User) => u.id === adminId);
      
      if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Kada ka yi amfani da ikon gudanarwa ba tare da tabbatar da mu`amala ba.' });
      }

      const answer = db.answers.find((a: Answer) => a.id === req.params.id);
      if (answer) {
        db.answers = db.answers.filter((a: Answer) => a.id !== req.params.id);
        db.comments = db.comments.filter((c: Comment) => c.parentId !== req.params.id);
        
        // Decrement answer counter in question
        const q = db.questions.find((q: Question) => q.id === answer.questionId);
        if (q) {
          q.answersCount = Math.max(0, (q.answersCount || 1) - 1);
        }
      }

      await writeDB(db);
      res.json({ success: true, message: 'An goge amsa ta matsayin Admin.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/comments/:id', async (req, res) => {
    try {
      const { adminId } = req.body;
      const db = await readDB();
      const adminUser = db.users.find((u: User) => u.id === adminId);
      
      if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Ikon goge maki na Admin ne kadai.' });
      }

      const comment = db.comments.find((c: Comment) => c.id === req.params.id);
      if (comment) {
        db.comments = db.comments.filter((c: Comment) => c.id !== req.params.id);
        
        // Decrement comment counter
        if (comment.parentType === 'question') {
          const q = db.questions.find((q: Question) => q.id === comment.parentId);
          if (q) {
            q.commentsCount = Math.max(0, (q.commentsCount || 1) - 1);
          }
        }
      }

      await writeDB(db);
      res.json({ success: true, message: 'An goge ra`ayi ta matsayin Admin.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Simulated Google Social Login for normal or admin users
  app.post('/api/auth/social-login', async (req, res) => {
    try {
      const { email, name, avatarUrl, provider, role } = req.body;
      if (!email || !name) {
        return res.status(400).json({ error: 'Bayanan imel ko suna basu cika ba.' });
      }

      const db = await readDB();
      let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        // Create new user via social login
        // Generate automatic username from email prefix
        let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        let username = baseUsername;
        let counter = 1;
        while (db.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        user = {
          id: crypto.randomUUID(),
          username,
          email: email.toLowerCase(),
          name,
          passwordHash: hashPassword(crypto.randomUUID()), // Safe random hash
          recoveryPin: '0000',
          role: role || UserRole.USER,
          reputation: 60, // Bonus for sign-in
          createdAt: new Date().toISOString(),
          avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80`,
          bio: `Shigo ta rukunin ${provider || 'Google'}`,
          interests: []
        };
        db.users.push(user);
        await writeDB(db);
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        reputation: user.reputation,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        interests: user.interests
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get Admin statistics
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const adminId = req.query.adminId as string;
      const db = await readDB();
      const adminUser = db.users.find((u: any) => u.id === adminId);
      if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Baka da ikon gudanarwa.' });
      }

      const totalUsers = db.users.length;
      const totalQuestions = db.questions.length;
      const totalAnswers = db.answers.length;
      const totalComments = db.comments.length;
      const totalRep = db.users.reduce((sum: number, u: any) => sum + (u.reputation || 0), 0);
      const avgRep = totalUsers > 0 ? Math.round(totalRep / totalUsers) : 0;

      // Extract all unique tags
      const tagSet = new Set<string>();
      db.questions.forEach((q: any) => {
        if (q.tags) {
          q.tags.forEach((t: string) => tagSet.add(t));
        }
      });

      res.json({
        usersCount: totalUsers,
        questionsCount: totalQuestions,
        answersCount: totalAnswers,
        commentsCount: totalComments,
        avgReputation: avgRep,
        allTags: Array.from(tagSet)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all users (Admin only)
  app.get('/api/admin/users', async (req, res) => {
    try {
      const adminId = req.query.adminId as string;
      const db = await readDB();
      const adminUser = db.users.find((u: any) => u.id === adminId);
      if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Baka da ikon gudanarwa.' });
      }

      // Return users without sensitive hash
      const cleanUsers = db.users.map(({ passwordHash, ...rest }: any) => rest);
      res.json(cleanUsers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update user role (Admin only)
  app.put('/api/admin/users/:id/role', async (req, res) => {
    try {
      const { adminId, role } = req.body;
      const db = await readDB();
      const adminUser = db.users.find((u: any) => u.id === adminId);
      if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Baka da ikon gudanarwa.' });
      }

      const user = db.users.find((u: any) => u.id === req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Ba a sami mai amfani ba.' });
      }

      // Prevent admin self-demotion to preserve at least one admin
      if (user.id === adminId && role !== UserRole.ADMIN) {
        return res.status(400).json({ error: 'Kada ka canza matsayinka da kanka don kiyaye tsarin gudanarwa.' });
      }

      user.role = role;
      await writeDB(db);
      res.json({ success: true, message: 'An canza matsayin mai amfani cikin nasara.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update user reputation (Admin only)
  app.put('/api/admin/users/:id/reputation', async (req, res) => {
    try {
      const { adminId, reputation } = req.body;
      const db = await readDB();
      const adminUser = db.users.find((u: any) => u.id === adminId);
      if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Baka da ikon gudanarwa.' });
      }

      const user = db.users.find((u: any) => u.id === req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Ba a sami mai amfani ba.' });
      }

      user.reputation = Number(reputation);
      await writeDB(db);
      res.json({ success: true, message: 'An gyara darajar maki na mai amfani.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete/Ban user (Admin only)
  app.delete('/api/admin/users/:id', async (req, res) => {
    try {
      const { adminId } = req.body;
      const db = await readDB();
      const adminUser = db.users.find((u: any) => u.id === adminId);
      if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Baka da ikon gudanarwa.' });
      }

      if (req.params.id === adminId) {
        return res.status(400).json({ error: 'Ba za ka iya goge kanka da kanka ba.' });
      }

      db.users = db.users.filter((u: any) => u.id !== req.params.id);
      
      // Optionally clean up or anonymize their content
      db.questions.forEach((q: any) => {
        if (q.authorId === req.params.id) {
          q.authorName = 'Gogaggen Mai Amfani';
          q.authorReputation = 0;
        }
      });
      db.answers.forEach((a: any) => {
        if (a.authorId === req.params.id) {
          a.authorName = 'Gogaggen Mai Amfani';
          a.authorReputation = 0;
        }
      });

      await writeDB(db);
      res.json({ success: true, message: 'An goge asusun mai amfani daga tsarin.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // Vite development server middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Matambayi Server] Sabar tana aiki a rukunin yanar gizo http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Kuskure ya faru lokacin tashi sabar guda daya:', err);
});
