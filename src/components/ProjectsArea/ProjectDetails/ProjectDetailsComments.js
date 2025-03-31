import React, { useState, useEffect, useRef } from 'react';
import { formatDistance } from 'date-fns';
import {
  MessageOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave, FaSpinner } from "react-icons/fa";
import { likeCommentProjectService } from '../../../services/likeCommentProjectService';
import {
  Avatar,
  Button,
  Input,
  Tooltip,
  Dropdown,
  Menu,
  Modal,
  Pagination,
  Card,
  notification
} from 'antd';

const { TextArea } = Input;
const { getProjectComments, commentProject, replyComment, updateComment, deleteComment, getCommentReplies } = likeCommentProjectService;

// Màu sắc cố định cho hệ thống gọi vốn
const PRIMARY_COLOR = '#fcd34d';
const SECONDARY_COLOR = '#fa8c16';
const BG_COLOR = '#f8f9fa';
const BORDER_COLOR = '#e8e8e8';

const CommentItem = ({ comment, onReply, onEdit, onDelete, isReply = false }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.comment);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(null);


  const handleReply = async () => {
    try {
      if (!expandedReplies) {
        await toggleReplies(comment.id);
      }
      await replyComment(comment.projectId, comment.id, replyContent);
      setIsReplying(false);
      setReplyContent('');
      onReply();
    } catch (error) {
      notification.warning({
        message: 'Reply Failed',
        description: error.response?.data?.message || 'An unexpected error occurred.',
      });
      console.error('Failed to reply:', error);
    }
  };

  const handleEdit = async () => {
    try {
      await updateComment(comment.id, editContent);
      setIsEditing(false);
      onEdit();
    } catch (error) {
      console.error('Failed to edit:', error);
    }
  };

  const handleDelete = async () => {
    try {
      if (comment.countReplyComment > 0) {
        Modal.warning({
          title: 'Cannot Delete Comment',
          content: 'You cannot delete a comment that has replies.',
        });
        return;
      }

      await deleteComment(comment.id);
      onDelete();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const toggleReplies = async (commentId) => {
    if (expandedReplies) {
      setExpandedReplies(null);
    } else {
      try {
        const response = await getCommentReplies(commentId, 0, 4);
        setExpandedReplies(response.data.data);
      } catch (error) {
        console.error('Error fetching comment replies:', error);
      }
    }
  };


  const menu = (
    <Menu
      items={[
        {
          key: '1',
          label: 'Edit',
          icon: <EditOutlined style={{ color: 'orange' }} />,
          onClick: () => setIsEditing(true)
        },
        {
          key: '2',
          label: 'Delete',
          icon: <DeleteOutlined style={{ color: 'red' }} />,
          onClick: () => setShowDeleteModal(true),
          disabled: comment.countReplyComment > 0
        }
      ]}
    />
  );

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        backgroundColor: BG_COLOR,
        borderColor: BORDER_COLOR
      }}
      bodyStyle={{ padding: 12 }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar
          src={comment.user.userAvatar || '/default-avatar.png'}
          alt={comment.user.fullName}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <span style={{ fontWeight: 500, marginRight: 8 }}>{comment.user.fullName}</span>
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                {formatDistance(new Date(comment.createdAt), new Date(), { addSuffix: true })}
              </span>
            </div>
            <Dropdown overlay={menu} trigger={['click']}>
              <MoreOutlined style={{ color: '#8c8c8c' }} />
            </Dropdown>
          </div>

          {isEditing ? (
            <div>
              <TextArea
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button size="small" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="primary"
                  onClick={handleEdit}
                  style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p style={{ marginBottom: 12 }}>{comment.comment}</p>
          )}

          <div style={{ display: 'flex', gap: 16 }}>
            {/* Only show the Reply button if the comment is not a reply */}
            {!isReply && (
              <Tooltip title="Reply">
                <Button
                  type="text"
                  size="small"
                  icon={<ShareAltOutlined style={{ transform: 'rotateY(180deg)' }} />}
                  onClick={() => setIsReplying(!isReplying)}
                >
                  Reply
                </Button>
              </Tooltip>
            )}
            {comment.countReplyComment > 0 && (
              <Button
                type="link"
                size="small"
                onClick={() => toggleReplies(comment.id)}
              >
                {expandedReplies ? 'Hide Replies' : `View Replies (${comment.countReplyComment})`}
              </Button>
            )}
          </div>

          {isReplying && (
            <div style={{ marginTop: 12 }}>
              <TextArea
                rows={2}
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button size="small" onClick={() => setIsReplying(false)}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="primary"
                  onClick={handleReply}
                  style={{ backgroundColor: SECONDARY_COLOR, borderColor: SECONDARY_COLOR }}
                >
                  Send
                </Button>
              </div>
            </div>
          )}

          {expandedReplies && (
            <div style={{ marginTop: 12, marginLeft: 44, borderLeft: `2px solid ${BORDER_COLOR}`, paddingLeft: 12 }}>
              {expandedReplies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        title="Confirm Delete"
        open={showDeleteModal}
        onOk={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{
          style: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }
        }}
      >
        <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
      </Modal>
    </Card>
  );
};

const ProjectDetailsComments = ({ getClassName, project, isAuthenticated }) => {
  const { id: projectId } = project;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const titleRef = useRef(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await getProjectComments(projectId, page, 10);
        setComments(response.data.data);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    };

    fetchComments();

    if (titleRef.current) {
      titleRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [projectId, page]);

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      notification.warning({
        message: 'Authentication Required',
        description: 'You must be logged or registered in to comment on this project.',
      });
      return;
    }

    try {
      await commentProject(projectId, newComment);
      setNewComment('');
      setPage(0);
      refreshComments();
    } catch (error) {
      notification.warning({
        message: 'Comment Failed',
        description: error.response?.data?.message || 'You must invest in this project to comment.',
      });
      console.error('Failed to submit comment:', error);
    }
  };

  const refreshComments = async () => {
    try {
      const response = await getProjectComments(projectId, 0, 10);
      setComments(response.data.data);
      setPage(0);
    } catch (error) {
      console.error('Failed to refresh comments:', error);
    }
  };

  return (
    <div className={`${getClassName?.("pills-4")} p-6 bg-white shadow-md rounded-lg`} id="pills-pills-4" role="tabpanel">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Only investors who have invested in this project can comment. Please ensure you are logged in to your account.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div style={{
        maxWidth: 800,
        margin: '24px auto',
        backgroundColor: BG_COLOR,
        padding: 24,
        borderRadius: 8,
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }} ref={titleRef}>
          <MessageOutlined style={{
            fontSize: 24,
            marginRight: 12,
            color: PRIMARY_COLOR
          }} />
          <h2 style={{
            fontSize: 20,
            fontWeight: 500,
            margin: 0,
            color: '#262626'
          }}>
            Project Comments
          </h2>
        </div>

        <div style={{ marginBottom: 24 }}>
          <TextArea
            placeholder="Share your thoughts about this project..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR, color: 'white' }}
            >
              Post Comment
            </Button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={refreshComments}
              onEdit={refreshComments}
              onDelete={refreshComments}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <Pagination
              current={page + 1}
              total={totalPages * 10}
              pageSize={10}
              onChange={(page) => setPage(page - 1)}
              showSizeChanger={false}
              showQuickJumper
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsComments;