import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { Colors } from '../theme/colors';

const GET_COMMENTS_QUERY = gql`
  query GetComments($postId: String!) {
    comments(postId: $postId) {
      _id
      content
      createdAt
      parentId
      postId
      userId {
        _id
        username
        displayName
        avatarUrl
      }
    }
  }
`;

const GET_REPLIES_QUERY = gql`
  query GetReplies($commentId: String!) {
    replies(commentId: $commentId) {
      _id
      content
      createdAt
      parentId
      postId
      userId {
        _id
        username
        displayName
        avatarUrl
      }
    }
  }
`;

const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($content: String!, $parentId: String, $postId: String!) {
    createComment(content: $content, parentId: $parentId, postId: $postId) {
      _id
      content
      createdAt
      parentId
      postId
      userId {
        _id
        username
        displayName
        avatarUrl
      }
    }
  }
`;

// Subcomponent to handle individual Comment and its replies
const CommentItem = ({ comment, onReplySelect, postId }: { comment: any; onReplySelect: (c: any) => void; postId: string }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [fetchReplies, { data: repliesData, loading: repliesLoading }] = useLazyQuery(GET_REPLIES_QUERY, {
    variables: { commentId: comment._id },
  });

  const toggleReplies = () => {
    if (!showReplies) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  const replies = repliesData?.replies || [];

  return (
    <View style={styles.commentItemContainer}>
      <View style={styles.commentRow}>
        {/* Avatar */}
        {comment.userId.avatarUrl ? (
          <Image source={{ uri: comment.userId.avatarUrl }} style={styles.commentAvatar} />
        ) : (
          <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>
              {comment.userId.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Content Box */}
        <View style={styles.commentContentBox}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentDisplayName}>{comment.userId.displayName}</Text>
            <Text style={styles.commentUsername}>@{comment.userId.username}</Text>
          </View>
          <Text style={styles.commentText}>{comment.content}</Text>

          <View style={styles.commentActions}>
            <Text style={styles.commentTime}>
              {(() => {
                const num = Number(comment.createdAt);
                const date = isNaN(num) ? new Date(comment.createdAt) : new Date(num);
                return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
              })()}
            </Text>
            <TouchableOpacity onPress={() => onReplySelect(comment)}>
              <Text style={styles.actionLink}>Reply</Text>
            </TouchableOpacity>

            {/* If it is a root comment, show view replies button */}
            {!comment.parentId && (
              <TouchableOpacity onPress={toggleReplies}>
                <Text style={styles.actionLink}>
                  {showReplies ? 'Hide replies' : 'View replies'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Replies Render Section */}
      {showReplies && (
        <View style={styles.repliesList}>
          {repliesLoading && (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 8 }} />
          )}
          {replies.map((reply: any) => (
            <View key={reply._id} style={styles.replyItemRow}>
              <View style={styles.replyIndentLine} />
              <View style={styles.commentRow}>
                {reply.userId.avatarUrl ? (
                  <Image source={{ uri: reply.userId.avatarUrl }} style={styles.replyAvatar} />
                ) : (
                  <View style={[styles.replyAvatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarPlaceholderText}>
                      {reply.userId.displayName?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.commentContentBox}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentDisplayName}>{reply.userId.displayName}</Text>
                    <Text style={styles.commentUsername}>@{reply.userId.username}</Text>
                  </View>
                  <Text style={styles.commentText}>{reply.content}</Text>
                  <View style={styles.commentActions}>
                    <Text style={styles.commentTime}>
                      {(() => {
                        const num = Number(reply.createdAt);
                        const date = isNaN(num) ? new Date(reply.createdAt) : new Date(num);
                        return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
                      })()}
                    </Text>
                    <TouchableOpacity onPress={() => onReplySelect(comment)}>
                      <Text style={styles.actionLink}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export const CommentsScreen = ({ route }: any) => {
  const { postId } = route.params;
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_COMMENTS_QUERY, {
    variables: { postId },
  });

  const [createComment, { loading: submitLoading }] = useMutation(CREATE_COMMENT_MUTATION, {
    refetchQueries: [{ query: GET_COMMENTS_QUERY, variables: { postId } }],
    onCompleted: () => {
      setContent('');
      setReplyingTo(null);
    },
    onError: (err) => {
      Alert.alert('Comment Failed', err.message);
    },
  });

  const handleSend = () => {
    if (!content.trim()) return;
    createComment({
      variables: {
        content: content.trim(),
        postId,
        parentId: replyingTo?._id || null,
      },
    });
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
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  const comments = data?.comments || [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            onReplySelect={setReplyingTo}
            postId={postId}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share your thoughts!</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={loading}
      />

      {/* Input Bar */}
      <View style={styles.inputSection}>
        {replyingTo && (
          <View style={styles.replyingBar}>
            <Text style={styles.replyingText}>
              Replying to @{replyingTo.userId.username}
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Text style={styles.cancelReplyText}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            placeholderTextColor={Colors.textDim}
            value={content}
            onChangeText={setContent}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !content.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!content.trim() || submitLoading}
          >
            {submitLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
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
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  commentItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentContentBox: {
    marginLeft: 12,
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  commentDisplayName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  commentUsername: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 6,
  },
  commentText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentTime: {
    fontSize: 11,
    color: Colors.textDim,
    marginRight: 16,
  },
  actionLink: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: 16,
  },
  repliesList: {
    marginTop: 8,
  },
  replyItemRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingLeft: 20,
  },
  replyIndentLine: {
    width: 2,
    backgroundColor: Colors.border,
    marginRight: 12,
    alignSelf: 'stretch',
    borderRadius: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  inputSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 12,
  },
  replyingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  replyingText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  cancelReplyText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputRow: {
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
