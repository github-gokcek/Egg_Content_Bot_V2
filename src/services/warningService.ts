import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export interface UserWarnings {
  userId: string;
  guildId: string;
  majorWarnings: number; // @Uyarı
  chatWarnings: number;  // @Uyarı Chat
  lastWarningAt: Date;
}

export async function removeMajorWarning(guildId: string, userId: string): Promise<number> {
  const warningRef = doc(db, 'warnings', `${guildId}_${userId}`);
  const warningDoc = await getDoc(warningRef);

  if (warningDoc.exists() && warningDoc.data().majorWarnings > 0) {
    await updateDoc(warningRef, {
      majorWarnings: increment(-1),
      lastWarningAt: new Date()
    });
    return (warningDoc.data().majorWarnings || 0) - 1;
  }
  return 0;
}

export async function removeChatWarning(guildId: string, userId: string): Promise<number> {
  const warningRef = doc(db, 'warnings', `${guildId}_${userId}`);
  const warningDoc = await getDoc(warningRef);

  if (warningDoc.exists() && warningDoc.data().chatWarnings > 0) {
    await updateDoc(warningRef, {
      chatWarnings: increment(-1),
      lastWarningAt: new Date()
    });
    return (warningDoc.data().chatWarnings || 0) - 1;
  }
  return 0;
}

export async function addMajorWarning(guildId: string, userId: string): Promise<number> {
  const warningRef = doc(db, 'warnings', `${guildId}_${userId}`);
  const warningDoc = await getDoc(warningRef);

  if (warningDoc.exists()) {
    await updateDoc(warningRef, {
      majorWarnings: increment(1),
      lastWarningAt: new Date()
    });
    return (warningDoc.data().majorWarnings || 0) + 1;
  } else {
    await setDoc(warningRef, {
      userId,
      guildId,
      majorWarnings: 1,
      chatWarnings: 0,
      lastWarningAt: new Date()
    });
    return 1;
  }
}

export async function addChatWarning(guildId: string, userId: string): Promise<number> {
  const warningRef = doc(db, 'warnings', `${guildId}_${userId}`);
  const warningDoc = await getDoc(warningRef);

  if (warningDoc.exists()) {
    await updateDoc(warningRef, {
      chatWarnings: increment(1),
      lastWarningAt: new Date()
    });
    return (warningDoc.data().chatWarnings || 0) + 1;
  } else {
    await setDoc(warningRef, {
      userId,
      guildId,
      majorWarnings: 0,
      chatWarnings: 1,
      lastWarningAt: new Date()
    });
    return 1;
  }
}

export async function getWarnings(guildId: string, userId: string): Promise<UserWarnings | null> {
  const warningRef = doc(db, 'warnings', `${guildId}_${userId}`);
  const warningDoc = await getDoc(warningRef);

  if (warningDoc.exists()) {
    return warningDoc.data() as UserWarnings;
  }
  return null;
}
