# Module: routes/attachments

## Attachment Management Routes

This module defines routes for creating, retrieving, updating, and deleting attachments associated with specific issues. Each route uses JWT-based authentication to ensure that only authorized users can interact with the attachments.

**IMPORTANT**: `authenticateToken` middleware authenticates using cookies, so when calling the API from the front-end, you must use `{ withCredentials: true }` to ensure authentication cookies are passed.

---

### Requires:
- `module: express`

---

### Members

#### (inner, constant) express
**Description**: Express module  
**Source**: `attachmentRoutes.js`, line 15

#### (inner, constant) s3Client
**Description**: AWS S3 Configuration  
Initializes an S3 client with credentials and region from environment variables. This client is used for managing attachments uploaded to the S3 bucket, including retrieving signed URLs and deleting files from the bucket.  
**Source**: `attachmentRoutes.js`, line 29

#### (inner, constant) upload
**Description**: Multer S3 Configuration  
Configures Multer to use S3 as the storage destination for file uploads. Files are stored under the 'attachments/' prefix, with a unique name generated using the current timestamp and the original file name.  
**Source**: `attachmentRoutes.js`, line 44

---

## Methods

### DELETE /:issueId/:attachmentId()

**Description**: Route to delete an attachment from an issue  
Deletes a specific attachment from an issue, identified by `issueId` and `attachmentId`. Only the user who uploaded the attachment or an admin can delete it. The file is also removed from S3.

#### Parameters:
| Name                   | Type   | Description                     |
|------------------------|--------|---------------------------------|
| `req.params.issueId`    | Object | The ID of the issue.            |
| `req.params.attachmentId`| Object | The ID of the attachment to delete.|

**Source**: `attachmentRoutes.js`, line 147

**Throws**:
- `403`: If the user is not authorized to delete the attachment.
- `404`: If the issue or attachment is not found.
- `500`: If an error occurs while deleting the attachment.

---

### GET /:issueId()

**Description**: Route to get attachments for an issue with signed URLs  
Retrieves the attachments for a specific issue, identified by `issueId`, and generates signed URLs for each attachment, allowing them to be downloaded securely.

#### Parameters:
| Name                   | Type   | Description         |
|------------------------|--------|---------------------|
| `req.params.issueId`    | Object | The ID of the issue. |

**Source**: `attachmentRoutes.js`, line 55

**Throws**:
- `404`: If the issue is not found.
- `500`: If an error occurs while retrieving attachments.

---

### GET /:issueId/signedUrls()

**Description**: Route to retrieve signed URLs for attachments  
This route generates signed URLs for attachments associated with a specific issue, allowing users to download files securely. The issue is identified by `issueId`.

#### Parameters:
| Name                   | Type   | Description         |
|------------------------|--------|---------------------|
| `req.params.issueId`    | Object | The ID of the issue. |

**Source**: `attachmentRoutes.js`, line 222

**Throws**:
- `404`: If the issue is not found.
- `500`: If an error occurs while generating the signed URLs.

---

### POST /:issueId()

**Description**: Route to upload attachments to an issue  
This route allows authenticated users to upload up to 5 files as attachments to a specific issue, identified by `issueId`. The files are uploaded to S3, and the attachment details (including signed URLs) are stored in the issue's `attachments` array.

#### Parameters:
| Name                | Type   | Description          |
|---------------------|--------|----------------------|
| `req.params.issueId` | Object | The ID of the issue.  |
| `req.files`         | Array  | The uploaded files.   |

**Source**: `attachmentRoutes.js`, line 92

**Throws**:
- `404`: If the issue is not found.
- `500`: If an error occurs while uploading the files.

---

# Module: routes/comments

## Comment Management Routes

This module defines routes for creating, retrieving, updating, and deleting comments associated with specific issues. Each route uses JWT-based authentication to ensure that only authorized users can interact with the comments.

**IMPORTANT**: `authenticateToken` middleware authenticates using cookies, so when calling the API from the front-end, you must use `{ withCredentials: true }` to ensure authentication cookies are passed.

---

### Requires:
- `module: express`

---

### Members

#### (inner, constant) express
**Description**: Express module  
**Source**: `commentsRoutes.js`, line 13

---

## Methods

### DELETE /:issueId/:commentId(req, res)

**Description**: Route to delete a specific comment from an issue  
This route allows an authenticated user to delete a specific comment from an issue. The issue is identified by `issueId` and the comment by `commentId`. Only the user who created the comment or an admin can delete it.

#### Parameters:
| Name | Type   | Description                 |
|------|--------|-----------------------------|
| `req`| Object | Express request object       |
| `res`| Object | Express response object      |

**Source**: `commentsRoutes.js`, line 119

**Throws**:
- `404`: If the issue or comment is not found.
- `403`: If the user is not authorized to delete the comment.
- `500`: If an error occurs while deleting the comment.

---

### GET /issues/:id/comments(req, res)

**Description**: Route to retrieve all comments for a specific issue  
This route allows an authenticated user to retrieve all comments associated with a specific issue. The issue is identified by `issueId`, and the comments are returned in the response.

#### Parameters:
| Name | Type   | Description                 |
|------|--------|-----------------------------|
| `req`| Object | Express request object       |
| `res`| Object | Express response object      |

**Source**: `commentsRoutes.js`, line 88

**Throws**:
- `404`: If the issue is not found.
- `500`: If an error occurs while fetching comments.

---

### POST /:issueId(res)

**Description**: Route to create a new comment for a specific issue  
This route allows an authenticated user to add a new comment to an existing issue. The issue is identified by `issueId`, and the comment details are provided in the request body. The comment is associated with the authenticated user's ID and appended to the issue's `comments` array.

#### Parameters:
| Name        | Type   | Description          |
|-------------|--------|----------------------|
| `req.body`  | Object | The comment data.     |
| `res`       | Object | Express response object|

**Source**: `commentsRoutes.js`, line 32

**Throws**:
- `401`: If the user is not authenticated.
- `404`: If the issue is not found.
- `500`: If there was an error adding the comment.

---

### PUT /:issueId/:commentId(res)

**Description**: Route to update a specific comment for an issue  
This route allows an authenticated user to update the description of a specific comment within an issue. The issue is identified by `issueId` and the comment by `commentId`. The updated description is provided in the request body.

#### Parameters:
| Name        | Type   | Description          |
|-------------|--------|----------------------|
| `req.body`  | Object | The updated comment data (description). |
| `res`       | Object | Express response object|

**Source**: `commentsRoutes.js`, line 160

**Throws**:
- `404`: If the issue or comment is not found.
- `500`: If an error occurs while updating the comment.

---

# Module: routes/issues

## Issue Management Routes

This module defines routes for creating, retrieving, updating, and deleting issues. Each route uses JWT-based authentication to ensure that only authorized users can interact with the issues.

**IMPORTANT**: `authenticateToken` middleware authenticates using cookies, so when calling the API from the front-end, you must use `{ withCredentials: true }` to ensure authentication cookies are passed.

---

### Requires:
- `module: express`

---

### Members

#### (inner, constant) express
**Description**: Express module  
**Source**: `IssueRoutes.js`, line 23

---

## Methods

### DELETE /issues/:id(req, res)

**Description**: Route to delete an issue  
This route allows an authenticated user to delete an issue they reported. An admin user can delete any issue.

#### Parameters:
| Name | Type   | Description                |
|------|--------|----------------------------|
| `req`| Object | Express request object      |
| `res`| Object | Express response object     |

**Source**: `IssueRoutes.js`, line 217

**Throws**:
- `404`: If the issue is not found.
- `403`: If the user is not authorized to delete the issue.
- `500`: If an error occurs while deleting the issue.

---

### GET /issues(req, res)

**Description**: Route to retrieve all issues or issues by a specific user  
This route allows an authenticated user to retrieve all issues. If a `userId` is provided as a query parameter, it filters the issues to only those reported by that specific user. The results are sorted by 'updated_at' in descending order.

#### Parameters:
| Name | Type   | Description                |
|------|--------|----------------------------|
| `req`| Object | Express request object      |
| `res`| Object | Express response object     |

**Source**: `IssueRoutes.js`, line 81

**Throws**:
- `404`: If no issues are found.
- `500`: If an error occurs while retrieving the issues.

---

### GET /issues/:id(req, res)

**Description**: Route to retrieve a single issue by its ID  
This route allows an authenticated user to retrieve a specific issue by its ID. The issue's occurrences are also populated. Only the reporter of the issue or an admin can access the issue.

#### Parameters:
| Name | Type   | Description                |
|------|--------|----------------------------|
| `req`| Object | Express request object      |
| `res`| Object | Express response object     |

**Source**: `IssueRoutes.js`, line 127

**Throws**:
- `404`: If the issue is not found.
- `403`: If the user is not authorized to view the issue.
- `500`: If an error occurs while retrieving the issue.

---

### POST /issues(res)

**Description**: Route to create a new issue  
This route allows an authenticated user to create a new issue. The user must provide a title, description, and other optional fields like `status_id`, `charm`, and `project_id`. The issue is associated with the authenticated user's ID and stored in the database.

#### Parameters:
| Name        | Type   | Description             |
|-------------|--------|-------------------------|
| `req.body`  | Object | The issue data (title, description, etc.) |
| `res`       | Object | Express response object |

**Source**: `IssueRoutes.js`, line 29

**Throws**:
- `400`: If required fields are missing or validation fails.
- `500`: If an error occurs while creating the issue.

---

### PUT /issues/:id(res)

**Description**: Route to update an existing issue  
This route allows an authenticated user to update the details of an existing issue that they reported. The user can update fields such as `description`, `status_id`, and `charm`.

#### Parameters:
| Name        | Type   | Description             |
|-------------|--------|-------------------------|
| `req.body`  | Object | The new data for the issue (description, status, etc.) |
| `res`       | Object | Express response object |

**Source**: `IssueRoutes.js`, line 156

**Throws**:
- `404`: If the issue is not found.
- `403`: If the user is not authorized to update the issue.
- `500`: If an error occurs while updating the issue.

---

# Module: routes/occurrences

## Occurrence Management Routes

This module defines routes for creating, retrieving, and deleting occurrences associated with specific issues. Each route uses JWT-based authentication to ensure that only authorized users can interact with the occurrences.

**IMPORTANT**: `authenticateToken` middleware authenticates using cookies, so when calling the API from the front-end, you must use `{ withCredentials: true }` to ensure authentication cookies are passed.

---

### Requires:
- `module: express`

---

### Members

#### (inner, constant) express
**Description**: Express module  
**Source**: `occurrenceRoutes.js`, line 12

---

## Methods

### DELETE /:issueId/:occurrenceId(req, res)

**Description**: Route to delete a specific occurrence from an issue  
This route allows an authenticated user to delete a specific occurrence from an issue. The issue is identified by `issueId` and the occurrence by `occurrenceId`. Only the user who created the occurrence or an admin can delete it.

#### Parameters:
| Name | Type   | Description                 |
|------|--------|-----------------------------|
| `req`| Object | Express request object       |
| `res`| Object | Express response object      |

**Source**: `occurrenceRoutes.js`, line 121

**Throws**:
- `404`: If the issue or occurrence is not found.
- `403`: If the user is not authorized to delete the occurrence.
- `500`: If an error occurs while deleting the occurrence.

---

### GET /issues/:id/occurrences(req, res)

**Description**: Route to retrieve all occurrences for a specific issue  
This route allows an authenticated user to retrieve all occurrences associated with a specific issue. The issue is identified by `issueId`, and the occurrences are returned in the response.

#### Parameters:
| Name | Type   | Description                 |
|------|--------|-----------------------------|
| `req`| Object | Express request object       |
| `res`| Object | Express response object      |

**Source**: `occurrenceRoutes.js`, line 90

**Throws**:
- `404`: If the issue is not found.
- `500`: If an error occurs while fetching the occurrences.

---

### POST /:issueId(res)

**Description**: Route to create a new occurrence for a specific issue  
This route allows an authenticated user to add a new occurrence to an existing issue. The issue is identified by `issueId`, and the occurrence details are provided in the request body. The occurrence is associated with the authenticated user's ID and appended to the issue's `occurrences` array.

#### Parameters:
| Name        | Type   | Description                |
|-------------|--------|----------------------------|
| `req.body`  | Object | The occurrence data (description) |
| `res`       | Object | Express response object     |

**Source**: `occurrenceRoutes.js`, line 30

**Throws**:
- `404`: If the issue is not found.
- `500`: If an error occurs while creating the occurrence.

---

### PUT /:issueId/:occurrenceId(res)

**Description**: Route to update a specific occurrence for an issue  
This route allows an authenticated user to update the description of a specific occurrence within an issue. The issue is identified by `issueId` and the occurrence by `occurrenceId`. The updated description is provided in the request body.

#### Parameters:
| Name        | Type   | Description                |
|-------------|--------|----------------------------|
| `req.body`  | Object | The updated occurrence data (description) |
| `res`       | Object | Express response object     |

**Source**: `occurrenceRoutes.js`, line 161

**Throws**:
- `404`: If the issue or occurrence is not found.
- `500`: If an error occurs while updating the occurrence.

---

# Module: routes/users

## User Management Routes

This module defines routes for user-related actions such as registration, login, updating user details, and deleting user accounts. Each route uses JWT-based authentication to ensure that only authorized users can interact with these endpoints.

**IMPORTANT**: `authenticateToken` middleware authenticates using cookies, so when calling the API from the front-end, you must use `{ withCredentials: true }` to ensure authentication cookies are passed.

---

### Requires:
- `module: express`

---

### Members

#### (inner, constant) express
**Description**: Express module  
**Source**: `usersRoutes.js`, line 12

---

## Methods

### DELETE /users/delete/:id(res)

**Description**: Route to delete a user account  
This route allows an authenticated admin user to delete a specific user account. The user is identified by their ID.

#### Parameters:
| Name | Type   | Description                |
|------|--------|----------------------------|
| `req.params.id`| Object | The ID of the user          |
| `res`| Object | Express response object     |

**Source**: `userRoutes.js`, line 409

**Throws**:
- `404`: If the user is not found.
- `403`: If the user is not authorized to delete the account.
- `500`: If an error occurs while deleting the account.

---

### GET /users/:id(res)

**Description**: Route to retrieve a user by ID  
This route is used to retrieve a user by their ID from the database.

#### Parameters:
| Name | Type   | Description                |
|------|--------|----------------------------|
| `req.params.id`| Object | The user ID                 |
| `res`| Object | Express response object     |

**Source**: `userRoutes.js`, line 262

**Throws**:
- `404`: If the user is not found.
- `500`: If an error occurs while retrieving the user.

---

### GET /users/all(res)

**Description**: Route to retrieve all users  
This route is used to retrieve all users from the database. The route is protected and only accessible by admin users.

#### Parameters:
| Name | Type   | Description                |
|------|--------|----------------------------|
| `res`| Object | Express response object     |

**Source**: `userRoutes.js`, line 294

**Throws**:
- `404`: If no users are found.
- `500`: If an error occurs while retrieving users.

---

### GET /users/check_token(res)

**Description**: Route to validate a user token  
This route is used to validate users so they can access protected routes. Used in `protectedRoutes.js`.

#### Parameters:
| Name | Type   | Description                |
|------|--------|----------------------------|
| `res`| Object | Express response object     |

**Source**: `userRoutes.js`, line 191

**Throws**:
- `500`: If an error occurs during token validation.

---

### GET /users/me(res)

**Description**: Route to retrieve the current user  
This route is used to retrieve the currently logged-in user by their ID from the database.

#### Parameters:
| Name | Type   | Description                |
|------|--------|----------------------------|
| `res`| Object | Express response object     |

**Source**: `userRoutes.js`, line 231

**Throws**:
- `404`: If the user is not found.
- `500`: If an error occurs while retrieving the user.

---

### POST /users/check_email(res)

**Description**: Route to determine if an email is already taken  
This route is used to check if an email is already taken during registration.

#### Parameters:
| Name          | Type   | Description           |
|---------------|--------|-----------------------|
| `req.body.email`| Object | The email to check      |
| `res`         | Object | Express response object |

**Source**: `userRoutes.js`, line 206

**Throws**:
- `404`: If the email is not found.
- `500`: If an error occurs during the email check.

---

### POST /users/login(res)

**Description**: Route to log in an existing user  
This route handles user login by verifying the provided email and password. If successful, a JWT token is generated and sent as a cookie in the response.

#### Parameters:
| Name      | Type   | Description                |
|-----------|--------|----------------------------|
| `req.body`| Object | The login credentials (email, password) |
| `res`     | Object | Express response object     |

**Source**: `userRoutes.js`, line 98

**Throws**:
- `401`: If the credentials are invalid.
- `500`: If an error occurs during login.

---

### POST /users/logout(res)

**Description**: Route to log out a user  
On logout, the access token and the refresh token are destroyed.

#### Parameters:
| Name         | Type   | Description            |
|--------------|--------|------------------------|
| `req.cookies`| Object | The cookie containing the refresh token |
| `res`        | Object | Express response object |

**Source**: `userRoutes.js`, line 162

**Throws**:
- `500`: If an error occurs during logout.

---

### POST /users/register(res)

**Description**: Route to register a new user  
This route handles user registration by validating the provided email and password, hashing the password, and storing the new user's data in the database. A JWT token is generated for the new user and sent as a cookie in the response.

#### Parameters:
| Name      | Type   | Description                |
|-----------|--------|----------------------------|
| `req.body`| Object | The user data (username, email, password) |
| `res`     | Object | Express response object     |

**Source**: `userRoutes.js`, line 25

**Throws**:
- `400`: If required fields are missing or validation fails.
- `500`: If an error occurs during registration.

---

### PUT /users/update-password(res)

**Description**: Route to update the password of the currently logged-in user  
This route allows users to change their password after performing necessary validations.

#### Parameters:
| Name          | Type   | Description          |
|---------------|--------|----------------------|
| `req.body.password`| Object | The new password    |
| `res`         | Object | Express response object|

**Source**: `userRoutes.js`, line 364

**Throws**:
- `400`: If validation fails.
- `500`: If an error occurs during the password update.

---

### PUT /users/update-username(res)

**Description**: Route to update the username of the currently logged-in user  
This route allows users to change their username after performing necessary validations.

#### Parameters:
| Name          | Type   | Description           |
|---------------|--------|-----------------------|
| `req.body.username`| Object | The new username    |
| `res`         | Object | Express response object|

**Source**: `userRoutes.js`, line 321

**Throws**:
- `400`: If validation fails.
- `500`: If an error occurs during the username update.
