import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

const GET_USER_QUERY = gql`
  query GetUser($username: String!) {
    user(username: $username) {
      _id
      username
      displayName
      bio
      avatarUrl
      coverPhotoUrl
      isPrivate
    }
  }
`;

const GET_USER_POSTS_QUERY = gql`
  query GetUserPosts($userId: String!) {
    userPosts(userId: $userId) {
      _id
      caption
      mediaUrls
      reactionCount
      commentCount
      createdAt
    }
  }
`;

const GET_USER_FOLLOWS_QUERY = gql`
  query GetUserFollows($userId: String!) {
    followers(userId: $userId) {
      _id
    }
    following(userId: $userId) {
      _id
    }
  }
`;

const IS_FOLLOWING_QUERY = gql`
  query IsFollowing($userId: String!) {
    isFollowing(userId: $userId)
  }
`;

const FOLLOW_USER_MUTATION = gql`
  mutation FollowUser($followingId: String!) {
    followUser(followingId: $followingId)
  }
`;

const UNFALLOW_USER_MUTATION = gql`
  mutation UnfollowUser($followingId: String!) {
    unfollowUser(followingId: $followingId)
  }
`;

export const ProfileScreen = ({ route, navigation }: any) => {
  const { user: currentUser, logout } = useAuth();
  const routeUsername = route?.params?.username;
  const isMe = !routeUsername || routeUsername.toLowerCase() === currentUser?.username?.toLowerCase();
  
  const targetUsername = isMe ? currentUser?.username : routeUsername;

  // 1. Fetch target user profile
  const { data: userData, loading: userLoading, error: userError, refetch: refetchUser } = useQuery(GET_USER_QUERY, {
    variables: { username: targetUsername },
    skip: !targetUsername,
  });

  const profileUser = userData?.user;

  // 2. Fetch target user's posts
  const { data: postsData, loading: postsLoading, refetch: refetchPosts } = useQuery(GET_USER_POSTS_QUERY, {
    variables: { userId: profileUser?._id },
    skip: !profileUser?._id,
  });

  // 3. Fetch target user's follows
  const { data: followsData, loading: followsLoading, refetch: refetchFollows } = useQuery(GET_USER_FOLLOWS_QUERY, {
    variables: { userId: profileUser?._id },
    skip: !profileUser?._id,
  });

  // 4. Check if following (if not me)
  const { data: followingData, refetch: refetchFollowing } = useQuery(IS_FOLLOWING_QUERY, {
    variables: { userId: profileUser?._id },
    skip: isMe || !profileUser?._id,
  });

  const isFollowing = followingData?.isFollowing;

  // Mutations
  const [followUser, { loading: followActionLoading }] = useMutation(FOLLOW_USER_MUTATION, {
    variables: { followingId: profileUser?._id },
    onCompleted: () => {
      refetchFollowing();
      refetchFollows();
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const [unfollowUser, { loading: unfollowActionLoading }] = useMutation(UNFALLOW_USER_MUTATION, {
    variables: { followingId: profileUser?._id },
    onCompleted: () => {
      refetchFollowing();
      refetchFollows();
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowUser();
    } else {
      followUser();
    }
  };

  const handleRefresh = () => {
    refetchUser();
    if (profileUser?._id) {
      refetchPosts();
      refetchFollows();
      if (!isMe) refetchFollowing();
    }
  };

  if (userLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (userError || !profileUser) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const posts = postsData?.userPosts || [];
  const followersCount = followsData?.followers?.length || 0;
  const followingCount = followsData?.following?.length || 0;

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          {profileUser.coverPhotoUrl ? (
            <Image source={{ uri: profileUser.coverPhotoUrl }} style={styles.coverPhoto} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
        </View>

        {/* Profile Info Row */}
        <View style={styles.profileInfoRow}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {profileUser.avatarUrl ? (
              <Image source={{ uri: profileUser.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {profileUser.displayName?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Follow/Edit Profile Button */}
          <View style={styles.actionButtonContainer}>
            {isMe ? (
              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutButtonText}>Log Out</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={handleFollowToggle}
                disabled={followActionLoading || unfollowActionLoading}
              >
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Display Name and Bio */}
        <View style={styles.detailsContainer}>
          <Text style={styles.displayName}>{profileUser.displayName}</Text>
          <Text style={styles.username}>@{profileUser.username}</Text>
          
          {profileUser.bio ? (
            <Text style={styles.bio}>{profileUser.bio}</Text>
          ) : null}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.divider} />
      </View>
    );
  };

  const renderPostItem = ({ item }: { item: any }) => {
    const hasMedia = item.mediaUrls && item.mediaUrls.length > 0;
    
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
      >
        {hasMedia ? (
          <Image source={{ uri: item.mediaUrls[0] }} style={styles.postImage} />
        ) : (
          <View style={styles.postTextPlaceholder}>
            <Text style={styles.postPlaceholderText} numberOfLines={4}>
              {item.caption}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      renderItem={renderPostItem}
      numColumns={3}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      }
      contentContainerStyle={styles.container}
      onRefresh={handleRefresh}
      refreshing={userLoading || postsLoading || followsLoading}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  headerContainer: {
    backgroundColor: Colors.background,
  },
  coverContainer: {
    height: 150,
    width: '100%',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: -45,
    marginBottom: 12,
  },
  avatarContainer: {
    borderWidth: 4,
    borderColor: Colors.background,
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  actionButtonContainer: {
    paddingBottom: 4,
  },
  followButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  followingButtonText: {
    color: Colors.textMuted,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: Colors.error,
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  username: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  bio: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  divider: {
    height: 8,
    backgroundColor: Colors.surfaceCard,
  },
  postItem: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH,
    padding: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postTextPlaceholder: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  postPlaceholderText: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: 16,
  },
});
