import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Colors } from '../theme/colors';
import { Logger } from '../utils/logger';

const EXPLORE_FEED_QUERY = gql`
  query ExploreFeed($limit: Int!, $cursor: String) {
    exploreFeed(limit: $limit, cursor: $cursor) {
      posts {
        _id
        caption
        mediaUrls
        reactionCount
        commentCount
        createdAt
      }
      nextCursor
      hasNextPage
    }
  }
`;

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

export const ExploreScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, error, fetchMore, refetch } = useQuery(EXPLORE_FEED_QUERY, {
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
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
    const feed = data?.exploreFeed;
    if (feed?.hasNextPage && feed?.nextCursor && !loading) {
      fetchMore({
        variables: {
          cursor: feed.nextCursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            exploreFeed: {
              ...fetchMoreResult.exploreFeed,
              posts: [
                ...(prev?.exploreFeed?.posts || []),
                ...(fetchMoreResult?.exploreFeed?.posts || []),
              ],
            },
          };
        },
      });
    }
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
        <Text style={styles.errorText}>Error loading explore: {error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const posts = data?.exploreFeed?.posts || [];

  // Filter posts locally if searchQuery is entered
  const filteredPosts = posts.filter(
    (post: any) =>
      post.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          placeholderTextColor={Colors.textDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item._id}
        renderItem={renderPostItem}
        numColumns={3}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        }
        ListFooterComponent={
          data?.exploreFeed?.hasNextPage ? (
            <ActivityIndicator style={{ padding: 16 }} color={Colors.primary} />
          ) : null
        }
      />
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
  searchHeader: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 14,
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
