import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface BotSettings {
  adChannelId?: string;
}

const SETTINGS_DOC = 'botSettings/config';

export async function getAdChannel(): Promise<string | null> {
  const docRef = doc(db, SETTINGS_DOC);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data() as BotSettings;
    return data.adChannelId || null;
  }
  
  return null;
}

export async function setAdChannel(channelId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_DOC);
  await setDoc(docRef, { adChannelId: channelId }, { merge: true });
}
