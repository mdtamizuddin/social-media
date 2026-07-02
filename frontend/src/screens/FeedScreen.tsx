import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { Colors } from '../theme/colors';
import { Logger } from '../utils/logger';

const { width } = Dimensions.get('window');

const HOME_FEED_QUERY = gql`
  query HomeFeed($limit: Int!, $cursor: String) {
    homeFeed(limit: $limit, cursor: $cursor) {
      posts {
        _id
        caption
        mediaUrls
        reactionCount
        commentCount
        createdAt
        myReaction
        reactionBreakdown {
          LIKE
          LOVE
          HAHA
          WOW
          SAD
          ANGRY
        }
        authorId {
          _id
          username
          displayName
          avatarUrl
        }
      }
      nextCursor
      hasNextPage
    }
  }
`;

const REACT_TO_POST_MUTATION = gql`
  mutation ReactToPost($postId: String!, $type: ReactionType!) {
    reactToPost(postId: $postId, type: $type) {
      _id
      reactionCount
      myReaction
      reactionBreakdown {
        LIKE
        LOVE
        HAHA
        WOW
        SAD
        ANGRY
      }
    }
  }
`;

const REACTION_EMOJIS = {
  LIKE: { emoji: '👍', label: 'Like', color: Colors.like },
  LOVE: { emoji: '❤️', label: 'Love', color: Colors.love },
  HAHA: { emoji: '😂', label: 'Haha', color: Colors.haha },
  WOW: { emoji: '😮', label: 'Wow', color: Colors.wow },
  SAD: { emoji: '😢', label: 'Sad', color: Colors.sad },
  ANGRY: { emoji: '😡', label: 'Angry', color: Colors.angry },
};

export const FeedScreen = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);

  const { data, loading, error, fetchMore, refetch } = useQuery(HOME_FEED_QUERY, {
    variables: { limit: 10 },
    notifyOnNetworkStatusChange: true,
  });

  const [reactToPost] = useMutation(REACT_TO_POST_MUTATION, {
    onError: (err) => {
      Logger.gqlError('FeedScreen', 'ReactToPost', err);
      Alert.alert('Error reacting', err.message);
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    const feed = data?.homeFeed;
    if (feed?.hasNextPage && feed?.nextCursor && !loading) {
      fetchMore({
        variables: {
          cursor: feed.nextCursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            homeFeed: {
              ...fetchMoreResult.homeFeed,
              posts: [
                ...(prev?.homeFeed?.posts || []),
                ...(fetchMoreResult?.homeFeed?.posts || []),
              ],
            },
          };
        },
      });
    }
  };

  const handleReactionPress = (postId: string, reactionType: keyof typeof REACTION_EMOJIS) => {
    reactToPost({
      variables: {
        postId,
        type: reactionType,
      },
    });
    setReactionModalVisible(false);
    setSelectedPostId(null);
  };

  const openReactionMenu = (postId: string) => {
    setSelectedPostId(postId);
    setReactionModalVisible(true);
  };

  const renderReactionBreakdown = (breakdown: any) => {
    const activeReactions = Object.keys(breakdown || {})
      .map(key => [key, breakdown[key]])
      .filter(([_, count]) => (count as number) > 0)
      .slice(0, 3); // Show top 3 reaction types

    if (activeReactions.length === 0) return null;

    return (
      <View style={styles.breakdownRow}>
        {activeReactions.map(([type, _]) => (
          <Text key={type} style={styles.breakdownEmoji}>
            {REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS]?.emoji}
          </Text>
        ))}
      </View>
    );
  };

  const renderPostCard = ({ item }: { item: any }) => {
    const author = item.authorId;
    const myReactionType = item.myReaction as keyof typeof REACTION_EMOJIS | null;
    const hasMedia = item.mediaUrls && item.mediaUrls.length > 0;
    
    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.authorContainer}
            onPress={() => navigation.navigate('Profile', { username: author.username })}
          >
            {author.avatarUrl ? (
              <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {author.displayName?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.authorInfo}>
              <Text style={styles.displayName}>{author.displayName}</Text>
              <Text style={styles.username}>@{author.username}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.timeText}>
            {(() => {
              const num = Number(item.createdAt);
              const date = isNaN(num) ? new Date(item.createdAt) : new Date(num);
              return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
            })()}
          </Text>
        </View>

        {/* Card Caption */}
        <Text style={styles.caption}>{item.caption}</Text>

        {/* Card Media */}
        {hasMedia && (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: item.mediaUrls[0] }} style={styles.mediaImage} resizeMode="cover" />
          </View>
        )}

        {/* Card Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.leftStats}>
            {renderReactionBreakdown(item.reactionBreakdown)}
            <Text style={styles.statText}>
              {item.reactionCount} {item.reactionCount === 1 ? 'reaction' : 'reactions'}
            </Text>
          </View>
          <Text style={styles.statText}>
            {item.commentCount} {item.commentCount === 1 ? 'comment' : 'comments'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Card Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReactionPress(item._id, myReactionType === 'LIKE' ? 'LIKE' : 'LIKE')}
            onLongPress={() => openReactionMenu(item._id)}
            delayLongPress={300}
          >
            <Text
              style={[
                styles.actionButtonText,
                myReactionType && {
                  color: REACTION_EMOJIS[myReactionType]?.color,
                  fontWeight: 'bold',
                },
              ]}
            >
              {myReactionType ? REACTION_EMOJIS[myReactionType].emoji : '👍'}{' '}
              {myReactionType ? REACTION_EMOJIS[myReactionType].label : 'Like'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Comments', { postId: item._id })}
          >
            <Text style={styles.actionButtonText}>💬 Comment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Antigravity Feed</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.createButtonText}>+ Create Post</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading feed: {error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const posts = data?.homeFeed?.posts || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPostCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Welcome! No posts in your feed yet.</Text>
            <Text style={styles.emptySubtext}>Follow users or create your first post!</Text>
          </View>
        }
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          data?.homeFeed?.hasNextPage ? (
            <ActivityIndicator style={{ padding: 16 }} color={Colors.primary} />
          ) : null
        }
      />

      {/* Reaction Select Pop-up Modal */}
      <Modal
        visible={reactionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setReactionModalVisible(false);
          setSelectedPostId(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setReactionModalVisible(false);
            setSelectedPostId(null);
          }}
        >
          <View style={styles.reactionPickerContainer}>
            {Object.keys(REACTION_EMOJIS).map((type) => {
              const data = REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS];
              return (
                <TouchableOpacity
                  key={type}
                  style={styles.reactionOption}
                  onPress={() => selectedPostId && handleReactionPress(selectedPostId, type as any)}
                >
                  <Text style={styles.reactionEmoji}>{data.emoji}</Text>
                  <Text style={styles.reactionLabel}>{data.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  feedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  username: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 1,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textDim,
  },
  caption: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaContainer: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: Colors.surfaceCard,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    marginRight: 6,
  },
  breakdownEmoji: {
    fontSize: 14,
    marginRight: -4,
  },
  statText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  actionButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPickerContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    padding: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '90%',
    justifyContent: 'space-around',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  reactionOption: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 28,
  },
  reactionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
});
