require('dotenv').config();
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const Issue = require('../models/Issue');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Comment Management Routes
 *
 * This module defines routes for creating, retrieving, and deleting comments
 * associated with specific issues. Each route uses JWT-based authentication to
 * ensure that only authorized users can interact with the comments.
 *
 * IMPORTANT: `authenticateToken` middleware authenticates using cookies, so when
 * calling the API from the front-end, you must use `{ withCredentials: true }` to
 * ensure authentication cookies are passed.
 */

/**
 * Route to create a new comment for a specific issue
 *
 * This route allows an authenticated user to add a new comment to an existing issue.
 * The issue is identified by `issueId`, and the comment details are provided in the request body.
 * The comment is associated with the authenticated user's ID and appended to the issue's
 * `comments` array.
 *
 * @name POST /:issueId
 * @function
 * @memberof module:routes/comments
 * @param {Object} req.body - The comment data (description).
 * @param {Object} res - The response object.
 * @throws {404} - If the issue is not found.
 * @throws {500} - If an error occurs while creating the comment.
 */
router.post('/:issueId', authenticateToken, async (req, res) => {
  const { comment_text } = req.body;
  const issueId = req.params.issueId;
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Fetch the issue document
    const issue = await Issue.findById(issueId);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Create a new comment with an _id and created_at timestamp
    const newComment = {
      _id: new mongoose.Types.ObjectId(), // Assign a new ObjectId
      user_id: userId,
      comment_text,
      created_at: new Date(),
    };

    // Push the new comment into the comments array
    issue.comments.push(newComment);

    // Save the issue document
    await issue.save();

    // Populate the user_id field of the newly added comment
    await issue.populate({
      path: 'comments.user_id',
      select: 'username',
      match: { _id: userId }, // Only populate the comments added by this user
    });

    // Find the newly added comment with populated user_id
    const addedComment = issue.comments.id(newComment._id);

    res.status(201).json({ message: 'Comment added', comment: addedComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Error adding comment', details: error.message });
  }
});

/**
 * Route to retrieve all comments for a specific issue
 *
 * This route allows an authenticated user to retrieve all comments associated
 * with a specific issue. The issue is identified by `issueId`, and the comments
 * are returned in the response.
 *
 * @name GET /issues/:id/comments
 * @function
 * @memberof module:routes/comments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {404} - If the issue is not found.
 * @throws {500} - If an error occurs while fetching the occurrences.
 */
router.get('/issues/:id/comments', authenticateToken, async (req, res) => {
  try {
    const issueID = req.params.id;

    // Find the issue and populate comments.user_id
    const issue = await Issue.findById(issueID)

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(200).json(issue.comments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching comments', details: error.message });
  }
});

/**
 * Route to delete a specific comment from an issue
 *
 * This route allows an authenticated user to delete a specific comment from an
 * issue. The issue is identified by `issueId` and the comment by `commentId`.
 * Only the user who created the comment or an admin can delete it.
 *
 * @name DELETE /:issueId/:commentId
 * @function
 * @memberof module:routes/comments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {404} - If the issue or occurrence is not found.
 * @throws {403} - If the user is not authorized to delete the comment.
 * @throws {500} - If an error occurs while deleting the comment.
 */
router.delete("/:issueId/:commentId", authenticateToken, async (req, res) => {
  try {
    const { issueId, commentId } = req.params;

    // Find the issue and remove the occurrence
    const updatedIssue = await Issue.findByIdAndUpdate(
      issueId,
      { $pull: { comments: { _id: commentId } } } ,
      { new: true } // This option returns the updated document
    );

    if (!updatedIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(200).json(updatedIssue);
  } catch (error) {
    console.error('Error deleting occurrence:', error);
    res.status(500).json({ error: 'Error deleting occurrence', details: error.message });
  }
});


/**
 * Route to update a specific comment for an issue
 *
 * This route allows an authenticated user to update the description of a specific comment
 * within an issue. The issue is identified by `issueId` and the comment by `commentId`.
 * The updated description is provided in the request body.
 *
 * @name PUT /:issueId/:commentId
 * @function
 * @memberof module:routes/comments
 * @param {Object} req.body - The updated comment data (description).
 * @param {Object} res - The response object.
 * @throws {404} - If the issue or comment is not found.
 * @throws {500} - If an error occurs while updating the comment.
 */

router.put('/:issueId/:commentId', authenticateToken, async (req, res) => {
  try {
    const { issueId, commentId } = req.params;
    const { comment_text } = req.body;

    // Update the specific comment using $set operator
    const updatedIssue = await Issue.findOneAndUpdate(
      { _id: issueId, 'comments._id': commentId },
      {
        $set: {
          'comments.$.comment_text': comment_text,
          'comments.$.updated_at': Date.now()
        }
      },
      { new: true, runValidators: false }
    );

    if (!updatedIssue) {
      return res.status(404).json({ message: 'Issue or comment not found' });
    }

    const updatedComment = updatedIssue.comments.find(
      comment => comment._id.toString() === commentId
    );

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

module.exports = router;
