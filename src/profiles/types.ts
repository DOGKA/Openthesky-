export type City = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  tz: string;
};

export type BirthProfile = {
  id: string;
  name: string;
  date: string;
  time: string;
  cityId: string;
  isMe?: boolean;
  example?: boolean;
};

export type Observer = {
  latitude: number;
  longitude: number;
  date: Date | null;
  label: string;
};

export type ProfilesStore = {
  profiles: BirthProfile[];
  me: BirthProfile;
  friends: BirthProfile[];
  byId: (id: string) => BirthProfile | undefined;
  upsert: (p: BirthProfile) => void;
  remove: (id: string) => void;
};
