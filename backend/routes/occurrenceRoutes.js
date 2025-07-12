require('dotenv').config();
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const Issue = require('../models/Issue');
const mongoose = require('mongoose');

/**
 * Occurrence Management Routes
 *
 * This module defines routes for creating, retrieving, and deleting occurrences
 * associated with specific issues. Each route uses JWT-based authentication to
 * ensure that only authorized users can interact with the occurrences.
 *
 * IMPORTANT: `authenticateToken` middleware authenticates using cookies, so when
 * calling the API from the front-end, you must use `{ withCredentials: true }` to
 * ensure authentication cookies are passed.
 */

/**
 * Route to create a new occurrence for a specific issue
 *
 * This route allows an authenticated user to add a new occurrence to an existing issue.
 * The issue is identified by `issueId`, and the occurrence details are provided in the request body.
 * The occurrence is associated with the authenticated user's ID and appended to the issue's
 * `occurrences` array.
 *
 * @name POST /:issueId
 * @function
 * @memberof module:routes/occurrences
 * @param {Object} req.body - The occurrence data (description).
 * @param {Object} res - The response object.
 * @throws {404} - If the issue is not found.
 * @throws {500} - If an error occurs while creating the occurrence.
 */
router.post('/:issueId', authenticateToken, async (req, res) => {

  const { description } = req.body;
  const issueId = req.params.issueId;
  const userId = req.user ? req.user.id : null;


  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const now = new Date();

    // Create a new occurrence with an _id and created_at timestamp
    const newOccurrence = {
      _id: new mongoose.Types.ObjectId(), // Assign a new ObjectId
      user_id: userId,
      description,
      created_at: now,
    };

    console.log('New occurrence:', newOccurrence);

    // Find the issue by ID
    const issue = await Issue.findById(issueId);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Push the new occurrence into the occurrences array
    issue.occurrences.push(newOccurrence);

    // Save the issue document
    await issue.save();

    // Populate the user_id field of the newly added occurrence
    await issue.populate({
      path: 'occurrences.user_id',
      select: 'username',
      match: { _id: userId }, // Only populate the occurrences added by this user
    });

    // Find the newly added occurrence with populated user_id
    const addedOccurrence = issue.occurrences.id(newOccurrence._id);

    res.status(201).json({ message: 'Occurrence added', occurrence: addedOccurrence });
  } catch (error) {
    console.error('Error adding occurrence:', error);
    res.status(500).json({ error: 'Error adding occurrence', details: error.message });
  }
});

/**
 * Route to retrieve all occurrences for a specific issue
 *
 * This route allows an authenticated user to retrieve all occurrences associated
 * with a specific issue. The issue is identified by `issueId`, and the occurrences
 * are returned in the response.
 *
 * @name GET /issues/:id/occurrences
 * @function
 * @memberof module:routes/occurrences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {404} - If the issue is not found.
 * @throws {500} - If an error occurs while fetching the occurrences.
 */
router.get('/issues/:id/occurrences', authenticateToken, async (req, res) => {
  try {
    const issueID = req.params.id;
    const issue = await Issue.findById(issueID)

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Return the occurrences array directly, since it's an embedded subdocument
    res.status(200).json(issue.occurrences);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching occurrences', details: error.message });
  }
});

/**
 * Route to delete a specific occurrence from an issue
 *
 * This route allows an authenticated user to delete a specific occurrence from an
 * issue. The issue is identified by `issueId` and the occurrence by `occurrenceId`.
 * Only the user who created the occurrence or an admin can delete it.
 *
 * @name DELETE /:issueId/:occurrenceId
 * @function
 * @memberof module:routes/occurrences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @throws {404} - If the issue or occurrence is not found.
 * @throws {403} - If the user is not authorized to delete the occurrence.
 * @throws {500} - If an error occurs while deleting the occurrence.
 */
router.delete('/:issueId/:occurrenceId', authenticateToken, async (req, res) => {
  try {
    const { issueId, occurrenceId } = req.params;

    // Find the issue and remove the occurrence
    const updatedIssue = await Issue.findByIdAndUpdate(
      issueId,
      { $pull: { occurrences: { _id: occurrenceId } } },
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
 * Route to update a specific occurrence for an issue
 *
 * This route allows an authenticated user to update the description of a specific occurrence
 * within an issue. The issue is identified by `issueId` and the occurrence by `occurrenceId`.
 * The updated description and created_at are provided in the request body.
 *
 * @name PUT /:issueId/:occurrenceId
 * @function
 * @memberof module:routes/occurrences
 * @param {Object} req.body - The updated occurrence data (description, created_at).
 * @param {Object} res - The response object.
 * @throws {404} - If the issue or occurrence is not found.
 * @throws {500} - If an error occurs while updating the occurrence.
 */

router.put('/:issueId/:occurrenceId', authenticateToken, async (req, res) => {
  try {
    const { issueId, occurrenceId } = req.params;
    const { description, created_at } = req.body;

    // Check if the provided created_at date is in the future
    if (created_at && new Date(created_at) > new Date()) {
      return res.status(400).json({ message: 'created_at date cannot be in the future' });
    }

    // Update the specific occurrence using $set operator
    const updateFields = {
      'occurrences.$.description': description,
      'occurrences.$.updated_at': Date.now()
    };

    if (created_at) {
      updateFields['occurrences.$.created_at'] = created_at;
    }

    const updatedIssue = await Issue.findOneAndUpdate(
      { _id: issueId, 'occurrences._id': occurrenceId },
      {
        $set: updateFields
      },
      { new: true, runValidators: false }
    );

    if (!updatedIssue) {
      return res.status(404).json({ message: 'Issue or occurrence not found' });
    }

    const updatedOccurrence = updatedIssue.occurrences.find(
      occ => occ._id.toString() === occurrenceId
    );

    res.json({
      message: 'Occurrence updated successfully',
      occurrence: updatedOccurrence
    });
  } catch (error) {
    console.error('Error updating occurrence:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

module.exports = router;
