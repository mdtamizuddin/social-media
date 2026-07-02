export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Explore: undefined;
  Notifications: undefined;
  Profile: { username?: string } | undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PostDetail: { postId: string };
  CreatePost: undefined;
  Comments: { postId: string };
};
