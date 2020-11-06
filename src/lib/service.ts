import type { AuthToken, Comment, CommentId, Discussion, DiscussionId, Success, User, UserId } from "./simple-comment";

/**
 * Accept a user name and password, return authentication token
 *
 * returns AuthToken
 **/
export const authPOST = () => new Promise<AuthToken | Error>((resolve, reject) => {
  resolve("3")
});



/**
 * Delete a specific comment
 *
 * discussionId byte[] 
 * commentId byte[] 
 * returns Success
 **/
export const commentDELETE = (discussionId: DiscussionId, commentId: CommentId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
  resolve()
});



/**
 * View a specific comment
 *
 * discussionId byte[] 
 * commentId byte[] 
 * returns Comment
 **/
export const commentGET = (discussionId: DiscussionId, commentId: CommentId, authUser?: UserId) => new Promise<Comment | Error>((resolve, reject) => {
  resolve()
});



/**
 * Edit a specific comment
 *
 * discussionId byte[] 
 * commentId byte[] 
 * returns Comment
 **/
export const discussionPUT = (discussionId: DiscussionId, commentId: CommentId, authUser: UserId) => new Promise<Comment | Error>((resolve, reject) => {
  resolve()
});



/**
 * Delete a discussion
 *
 * discussionId byte[] 
 * returns Success
 **/
export const discussionDELETE = (discussionId: DiscussionId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
  resolve()
});



/**
 * View specific discussion
 *
 * discussionId byte[] 
 * returns Discussion
 **/
export const discussionGET = (discussionId: DiscussionId, authUser?: UserId) => new Promise<Discussion | Error>((resolve, reject) => {
  resolve()
});



/**
 * Post a comment to specific discussion
 *
 * discussionId byte[] 
 * returns Comment
 **/
export const discussionPOST = (discussionId: DiscussionId, authUser: UserId) => new Promise<Comment | Error>((resolve, reject) => {
  resolve()
});



/**
 * Discussion discovery
 * Receive a listing of all discussions
 *
 * returns List
 **/
export const discussionListGET = (authUser?: UserId) => new Promise<Discussion[] | Error>((resolve, reject) => {
  resolve()
});



/**
 * List all users
 *
 * returns List
 **/
export const userListGET = (authUser?: UserId) => new Promise<User[] | Error>((resolve, reject) => {
  resolve()
});



/**
 * User created
 * returns User
 **/
export const userPOST = () => new Promise<User | Error>((resolve, reject) => {
  resolve()
});



/**
 * Delete a user
 *
 * userId byte[] 
 * returns Success
 **/
export const userDELETE = (userId: UserId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
  resolve()
});



/**
 * View user
 *
 * userId byte[] 
 * returns User
 **/
export const userGET = (userId: UserId, authUser?: UserId) => new Promise<User | Error>((resolve, reject) => {
  resolve()
});



/**
 * Edit a user
 *
 * userId byte[] 
 * returns Success
 **/
export const userPUT = (userId: UserId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
  resolve()
});


