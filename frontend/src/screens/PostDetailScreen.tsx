import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useRealTime } from '../context/RealTimeContext';
import { Colors } from '../theme/colors';
import { Logger } from '../utils/logger';

const GET_POST_QUERY = gql`
  query GetPost($id: String!) {
    post(id: $id) {
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
  }
`;

const GET_COMMENTS_QUERY = gql`
  query GetComments($postId: String!) {
    comments(postId: $postId) {
      _id
      content
      createdAt
      userId {
        _id
        username
        displayName
        avatarUrl
      }
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

const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($content: String!, $postId: String!) {
    createComment(content: $content, postId: $postId) {
      _id
      content
      createdAt
      userId {
        _id
        username
        displayName
        avatarUrl
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

export const PostDetailScreen = ({ route, navigation }: any) => {
  const { postId } = route.params;
  const [commentText, setCommentText] = useState('');
  const { subscribe } = useRealTime();

  // Queries
  const { data: postData, loading: postLoading, error: postError, refetch: refetchPost } = useQuery(GET_POST_QUERY, {
    variables: { id: postId },
  });

  const { data: commentsData, loading: commentsLoading, refetch: refetchComments } = useQuery(GET_COMMENTS_QUERY, {
    variables: { postId },
  });

  // Mutations
  const [reactToPost] = useMutation(REACT_TO_POST_MUTATION, {
    onError: (err) => {
      Logger.gqlError('PostDetailScreen', 'ReactToPost', err);
      Alert.alert('Error', err.message);
    },
  });

  const [createComment, { loading: commentSubmitLoading }] = useMutation(CREATE_COMMENT_MUTATION, {
    refetchQueries: [{ query: GET_COMMENTS_QUERY, variables: { postId } }, { query: GET_POST_QUERY, variables: { id: postId } }],
    onCompleted: () => setCommentText(''),
    onError: (err) => {
      Logger.gqlError('PostDetailScreen', 'CreateComment', err);
      Alert.alert('Comment Failed', err.message);
    },
  });

  // Real-Time subscription
  useEffect(() => {
    const unsubscribeReaction = subscribe(`post-${postId}`, 'post:reacted', () => {
      refetchPost();
    });

    const unsubscribeComment = subscribe(`post-${postId}`, 'comment:new', () => {
      refetchComments();
      refetchPost();
    });

    return () => {
      unsubscribeReaction();
      unsubscribeComment();
    };
  }, [postId]);

  const handleReact = (type: keyof typeof REACTION_EMOJIS) => {
    reactToPost({
      variables: {
        postId,
        type,
      },
    });
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    createComment({
      variables: {
        content: commentText.trim(),
        postId,
      },
    });
  };

  if (postLoading && !postData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (postError || !postData?.post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  const post = postData.post;
  const comments = commentsData?.comments || [];
  const myReaction = post.myReaction as keyof typeof REACTION_EMOJIS | null;

  const renderHeader = () => {
    const author = post.authorId;
    return (
      <View style={styles.headerContainer}>
        {/* Author Header */}
        <View style={styles.authorRow}>
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
              const num = Number(post.createdAt);
              const date = isNaN(num) ? new Date(post.createdAt) : new Date(num);
              return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
            })()}
          </Text>
        </View>

        {/* Caption */}
        <Text style={styles.caption}>{post.caption}</Text>

        {/* Media */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <Image source={{ uri: post.mediaUrls[0] }} style={styles.postImage} resizeMode="contain" />
        )}

        {/* Reaction Counts Breakdown */}
        <View style={styles.reactionBreakdownRow}>
          {Object.keys(post.reactionBreakdown).map((type) => {
            const count = post.reactionBreakdown[type as keyof typeof post.reactionBreakdown];
            const reactionCount = count as number;
            if (reactionCount === 0) return null;
            const emojiInfo = REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS];
            return (
              <View key={type} style={styles.breakdownBadge}>
                <Text style={styles.badgeEmoji}>{emojiInfo.emoji}</Text>
                <Text style={styles.badgeCount}>{reactionCount}</Text>
              </View>
            );
          })}
          {post.reactionCount === 0 && (
            <Text style={styles.noReactionsText}>No reactions yet</Text>
          )}
        </View>

        {/* Reaction Buttons bar */}
        <View style={styles.divider} />
        <View style={styles.reactionButtonsRow}>
          {Object.keys(REACTION_EMOJIS).map((type) => {
            const emojiInfo = REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS];
            const isActive = myReaction === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.reactionButton,
                  isActive && { backgroundColor: Colors.surfaceCard },
                ]}
                onPress={() => handleReact(type as any)}
              >
                <Text style={[styles.reactionButtonEmoji]}>{emojiInfo.emoji}</Text>
                <Text
                  style={[
                    styles.reactionButtonLabel,
                    isActive && { color: emojiInfo.color, fontWeight: 'bold' },
                  ]}
                >
                  {emojiInfo.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.divider} />

        <Text style={styles.commentsSectionTitle}>Comments ({comments.length})</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            {item.userId.avatarUrl ? (
              <Image source={{ uri: item.userId.avatarUrl }} style={styles.commentAvatar} />
            ) : (
              <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.commentAvatarPlaceholderText}>
                  {item.userId.displayName?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentDisplayName}>{item.userId.displayName}</Text>
                <Text style={styles.commentUsername}>@{item.userId.username}</Text>
              </View>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCommentsContainer}>
            <Text style={styles.emptyCommentsText}>No comments yet.</Text>
          </View>
        }
        contentContainerStyle={styles.scrollContent}
        onRefresh={refetchComments}
        refreshing={commentsLoading}
      />

      {/* Input Bar */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor={Colors.textDim}
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || commentSubmitLoading}
        >
          {commentSubmitLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.sendButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: Colors.white,
    fontSize: 18,
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
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textDim,
  },
  caption: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: Colors.surfaceCard,
    marginBottom: 16,
  },
  reactionBreakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  breakdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeEmoji: {
    fontSize: 14,
  },
  badgeCount: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noReactionsText: {
    color: Colors.textDim,
    fontSize: 13,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  reactionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  reactionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 4,
  },
  reactionButtonEmoji: {
    fontSize: 18,
  },
  reactionButtonLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarPlaceholderText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentContent: {
    marginLeft: 12,
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  commentDisplayName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
  },
  commentUsername: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 6,
  },
  commentText: {
    color: Colors.text,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyCommentsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyCommentsText: {
    color: Colors.textDim,
    fontSize: 14,
  },
  inputSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 100,
    color: Colors.text,
    fontSize: 14,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceCard,
  },
  sendButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
