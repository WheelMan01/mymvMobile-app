import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { getComments, addComment, Comment } from '../services/showroomApi';

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
  isMarketplaceListing?: boolean;
}

export default function CommentsModal({ visible, onClose, vehicleId, isMarketplaceListing = false }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && vehicleId) {
      loadComments();
    }
  }, [visible, vehicleId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await getComments(vehicleId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      await addComment(vehicleId, commentText.trim());
      setCommentText('');
      await loadComments(); // Reload comments
    } catch (error: any) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 404) {
        alert('Comments are only available for user vehicles in the showroom. Marketplace listings do not support comments yet.');
      } else {
        alert('Failed to add comment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <ScrollView style={styles.commentsList}>
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : comments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No comments yet.</Text>
                <Text style={styles.emptyStateSubtext}>Be the first to comment!</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.avatarText}>
                      {comment.user_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentAuthor}>{comment.user_name}</Text>
                    <Text style={styles.commentText}>{comment.comment_text}</Text>
                    <Text style={styles.commentTime}>{formatDate(comment.created_at)}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Add Comment Input or Info Message */}
          {isMarketplaceListing ? (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                💬 Comments are only available for your own vehicles in the showroom.
              </Text>
              <Text style={styles.infoSubtext}>
                Marketplace listings don't support comments yet.
              </Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                autoFocus={Platform.OS === 'web'}
                editable={!submitting}
                onFocus={() => console.log('Comment input focused')}
                onBlur={() => console.log('Comment input blurred')}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={!commentText.trim() || submitting}
                style={[
                  styles.postButton,
                  (!commentText.trim() || submitting) && styles.postButtonDisabled
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 4
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666'
  },
  commentsList: {
    flex: 1,
    padding: 16
  },
  loader: {
    marginTop: 32
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999'
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  commentContent: {
    flex: 1
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20
  },
  commentTime: {
    fontSize: 12,
    color: '#999'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 8
  },
  postButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60
  },
  postButtonDisabled: {
    backgroundColor: '#CCC'
  },
  postButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold'
  }
});