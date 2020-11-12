import { AdminSafeUser, Comment, DeletedComment, Discussion, PublicSafeUser, Topic, User } from "./simple-comment"

/**
 * Return object with properties in props removed
 */
export const omitProperties = <T>(obj: T, propsToRemove: (keyof T)[]): Partial<T> => 
  (Object.keys(obj) as (keyof T)[])
    .reduce((outObj, key: (keyof T)) => propsToRemove.includes(key) ? outObj : { ...outObj, [key]: obj[key] }, {})

/**
 * These are user properties that are unsafe to return to admins
 */
export const adminUnsafeUserProperties: (keyof User)[] = ["hash", "_id"]
/**
 * These are user properties that are unsafe to return to ordinary users and the public
 */
export const publicUnsafeUserProperties: (keyof User)[] = [...adminUnsafeUserProperties, "email", "isVerified"]
/**
 * These are user properties that only admins can modify on users 
 */
export const adminOnlyModifiableUserProperties: (keyof User)[] = ["isVerified", "isAdmin"]
/**
 * Return a user object that is clean and secure
 */
export const toSafeUser = (user: User, isAdmin: boolean = false): (PublicSafeUser | AdminSafeUser) => isAdmin ? toAdminSafeUser(user)
    : toPublicSafeUser(user)
export const toPublicSafeUser = (user:User) => user? omitProperties(user, publicUnsafeUserProperties) as PublicSafeUser : user
export const toAdminSafeUser = (user:User) => user? omitProperties(user, adminUnsafeUserProperties) as AdminSafeUser : user

export const isComment = (target: Comment | Discussion): target is Comment => target && target.hasOwnProperty("parentId")
export const isDeletedComment = (target: Comment | Discussion): target is DeletedComment => isComment(target) && target.hasOwnProperty("dateDeleted")

export const isAdminSafeUser = (user:Partial<User>): user is AdminSafeUser => (Object.keys(user) as (keyof User)[]).every(key => !adminOnlyModifiableUserProperties.includes(key))
export const isPublicSafeUser = (user:Partial<User>): user is PublicSafeUser => (Object.keys(user) as (keyof User)[]).every(key => !publicUnsafeUserProperties.includes(key))
