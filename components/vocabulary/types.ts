export interface IeltsDeckWord {
  id: string;
  deck_id: string;
  word: string;
  partOfSpeech?: string | null;
  uzbek?: string | null;
  rus?: string | null;
  example?: string | null;
  definition?: string | null;
  image_url?: string | null;
  audio_url?: string | null;
}

export interface IeltsVocabularyDeck {
  id: string;
  ielts_vocabulary_id: string;
  title: string;
  words?: IeltsDeckWord[];
}

export interface IeltsVocabulary {
  id: string;
  title: string;
  description?: string | null;
  decks?: IeltsVocabularyDeck[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
